import { toast } from "sonner";

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
 */
export const isRefreshTokenExpired = (error: any): boolean => {
  return error.response?.status === 401 || 
         error.response?.status === 422 ||
         error.message?.includes('expired') ||
         error.response?.data?.detail?.includes('expired') ||
         error.response?.data?.message?.includes('expired');
};

/**
 * Checks if an error is an authentication error
 */
export const isAuthenticationError = (error: any): boolean => {
  return error.response?.status === 401 || 
         error.response?.status === 403 ||
         error.message?.includes('unauthorized') ||
         error.message?.includes('forbidden') ||
         error.message?.includes('unauthorized') ||
         error.message?.includes('forbidden');
};
