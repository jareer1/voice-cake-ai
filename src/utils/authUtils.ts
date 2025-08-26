import { toast } from "sonner";

// Standardized error codes from backend
export enum ErrorCode {
  // Authentication
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS", 
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  
  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  
  // Resources
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
  
  // Business Logic
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  
  // External Services
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  
  // Internal
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
}

/**
 * Interface for standardized error responses
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  error_code: ErrorCode;
  details?: {
    validation_errors?: Array<{
      field: string;
      message: string;
      value?: string;
    }>;
    [key: string]: any;
  };
  timestamp: string;
  request_id: string;
  data: null;
}

/**
 * Extracts user-friendly error message from API response
 * Ensures no confidential information is exposed
 */
export const getErrorMessage = (error: any): string => {
  // Handle standardized API error responses
  if (error.response?.data && typeof error.response.data === 'object') {
    const apiError = error.response.data as Partial<ApiErrorResponse>;
    
    // If it's a standardized error response, use the message
    if (apiError.success === false && apiError.message) {
      return apiError.message;
    }
    
    // Fallback to generic message for non-standardized errors
    return apiError.message || "An error occurred. Please try again.";
  }
  
  // Handle network errors or other types
  if (error.message) {
    // Only show safe error messages
    const safeMessage = error.message.toLowerCase();
    if (safeMessage.includes('network') || safeMessage.includes('timeout')) {
      return "Network error. Please check your connection and try again.";
    }
    if (safeMessage.includes('unauthorized') || safeMessage.includes('forbidden')) {
      return "You are not authorized to perform this action.";
    }
  }
  
  // Default safe message
  return "An error occurred. Please try again.";
};

/**
 * Handles logout when refresh token expires
 * This function can be called from anywhere in the app when authentication fails
 */
export const handleRefreshTokenExpiration = () => {
  console.log('🔄 Handling refresh token expiration...');
  
  // Clear all authentication data
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  
  // Show user-friendly message
  toast.error("Your session has expired. Please log in again.", {
    duration: 5000,
    position: "top-right"
  });
  
  // Redirect to login page after a short delay to allow toast to show
  setTimeout(() => {
    window.location.href = "/auth/signin";
  }, 1000);
};

/**
 * Checks if an error is related to expired refresh token
 * Updated to handle new standardized error codes
 */
export const isRefreshTokenExpired = (error: any): boolean => {
  // Check for standardized error codes
  if (error.response?.data?.error_code) {
    const errorCode = error.response.data.error_code;
    return errorCode === ErrorCode.TOKEN_EXPIRED || 
           errorCode === ErrorCode.UNAUTHORIZED;
  }
  
  // Fallback to legacy checks
  return error.response?.status === 401 || 
         error.response?.status === 422 ||
         error.message?.includes('expired') ||
         error.response?.data?.detail?.includes('expired') ||
         error.response?.data?.message?.includes('expired');
};

/**
 * Checks if an error is an authentication error
 * Updated to handle new standardized error codes
 */
export const isAuthenticationError = (error: any): boolean => {
  // Check for standardized error codes
  if (error.response?.data?.error_code) {
    const errorCode = error.response.data.error_code;
    return errorCode === ErrorCode.UNAUTHORIZED || 
           errorCode === ErrorCode.INVALID_CREDENTIALS ||
           errorCode === ErrorCode.TOKEN_EXPIRED;
  }
  
  // Fallback to legacy checks
  return error.response?.status === 401 || 
         error.response?.status === 403 ||
         error.message?.includes('unauthorized') ||
         error.message?.includes('forbidden');
};

/**
 * Checks if an error is a validation error
 */
export const isValidationError = (error: any): boolean => {
  if (error.response?.data?.error_code) {
    const errorCode = error.response.data.error_code;
    return errorCode === ErrorCode.VALIDATION_ERROR || 
           errorCode === ErrorCode.INVALID_INPUT;
  }
  return false;
};

/**
 * Checks if an error is a rate limiting error
 */
export const isRateLimitError = (error: any): boolean => {
  if (error.response?.data?.error_code) {
    return error.response.data.error_code === ErrorCode.RATE_LIMIT_EXCEEDED;
  }
  return error.response?.status === 429;
};

/**
 * Safely logs error information without exposing sensitive data
 */
export const safeLogError = (error: any, context: string = 'API Error') => {
  const logData: any = {
    context,
    timestamp: new Date().toISOString(),
    hasResponse: !!error.response,
    status: error.response?.status,
    errorCode: error.response?.data?.error_code,
    requestId: error.response?.data?.request_id,
    message: getErrorMessage(error)
  };
  
  // Only log validation errors if they don't contain sensitive data
  if (error.response?.data?.details?.validation_errors) {
    logData.validationErrors = error.response.data.details.validation_errors.map((err: any) => ({
      field: err.field,
      message: err.message,
      hasValue: !!err.value
    }));
  }
  
  console.error('🔒 Safe Error Log:', logData);
};
