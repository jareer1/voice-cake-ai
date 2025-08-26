import { 
  isRefreshTokenExpired, 
  isAuthenticationError, 
  isValidationError,
  isRateLimitError,
  getErrorMessage,
  ErrorCode
} from '../authUtils';

describe('authUtils', () => {
  describe('isRefreshTokenExpired', () => {
    it('should return true for TOKEN_EXPIRED error code', () => {
      const error = { 
        response: { 
          data: { 
            success: false,
            error_code: ErrorCode.TOKEN_EXPIRED 
          } 
        } 
      };
      expect(isRefreshTokenExpired(error)).toBe(true);
    });

    it('should return true for UNAUTHORIZED error code', () => {
      const error = { 
        response: { 
          data: { 
            success: false,
            error_code: ErrorCode.UNAUTHORIZED 
          } 
        } 
      };
      expect(isRefreshTokenExpired(error)).toBe(true);
    });

    it('should return true for 401 status (legacy)', () => {
      const error = { response: { status: 401 } };
      expect(isRefreshTokenExpired(error)).toBe(true);
    });

    it('should return true for 422 status (legacy)', () => {
      const error = { response: { status: 422 } };
      expect(isRefreshTokenExpired(error)).toBe(true);
    });

    it('should return true for error message containing "expired" (legacy)', () => {
      const error = { message: 'Token has expired' };
      expect(isRefreshTokenExpired(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = { 
        response: { 
          status: 500, 
          data: { 
            success: false,
            error_code: ErrorCode.INTERNAL_SERVER_ERROR 
          } 
        } 
      };
      expect(isRefreshTokenExpired(error)).toBe(false);
    });
  });

  describe('isAuthenticationError', () => {
    it('should return true for UNAUTHORIZED error code', () => {
      const error = { 
        response: { 
          data: { 
            success: false,
            error_code: ErrorCode.UNAUTHORIZED 
          } 
        } 
      };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true for INVALID_CREDENTIALS error code', () => {
      const error = { 
        response: { 
          data: { 
            success: false,
            error_code: ErrorCode.INVALID_CREDENTIALS 
          } 
        } 
      };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true for TOKEN_EXPIRED error code', () => {
      const error = { 
        response: { 
          data: { 
            success: false,
            error_code: ErrorCode.TOKEN_EXPIRED 
          } 
        } 
      };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true for 401 status (legacy)', () => {
      const error = { response: { status: 401 } };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true for 403 status (legacy)', () => {
      const error = { response: { status: 403 } };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = { 
        response: { 
          status: 500, 
          data: { 
            success: false,
            error_code: ErrorCode.INTERNAL_SERVER_ERROR 
          } 
        } 
      };
      expect(isAuthenticationError(error)).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should return true for VALIDATION_ERROR error code', () => {
      const error = { 
        response: { 
          data: { 
            success: false,
            error_code: ErrorCode.VALIDATION_ERROR 
          } 
        } 
      };
      expect(isValidationError(error)).toBe(true);
    });

    it('should return true for INVALID_INPUT error code', () => {
      const error = { 
        response: { 
          data: { 
            success: false,
            error_code: ErrorCode.INVALID_INPUT 
          } 
        } 
      };
      expect(isValidationError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = { 
        response: { 
          data: { 
            success: false,
            error_code: ErrorCode.UNAUTHORIZED 
          } 
        } 
      };
      expect(isValidationError(error)).toBe(false);
    });
  });

  describe('isRateLimitError', () => {
    it('should return true for RATE_LIMIT_EXCEEDED error code', () => {
      const error = { 
        response: { 
          data: { 
            success: false,
            error_code: ErrorCode.RATE_LIMIT_EXCEEDED 
          } 
        } 
      };
      expect(isRateLimitError(error)).toBe(true);
    });

    it('should return true for 429 status (legacy)', () => {
      const error = { response: { status: 429 } };
      expect(isRateLimitError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = { 
        response: { 
          status: 500, 
          data: { 
            success: false,
            error_code: ErrorCode.INTERNAL_SERVER_ERROR 
          } 
        } 
      };
      expect(isRateLimitError(error)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return standardized error message', () => {
      const error = { 
        response: { 
          data: { 
            success: false,
            message: 'User-friendly error message',
            error_code: ErrorCode.VALIDATION_ERROR 
          } 
        } 
      };
      expect(getErrorMessage(error)).toBe('User-friendly error message');
    });

    it('should return fallback message for non-standardized errors', () => {
      const error = { 
        response: { 
          data: { 
            message: 'Legacy error message'
          } 
        } 
      };
      expect(getErrorMessage(error)).toBe('Legacy error message');
    });

    it('should return safe message for network errors', () => {
      const error = { message: 'Network Error' };
      expect(getErrorMessage(error)).toBe('Network error. Please check your connection and try again.');
    });

    it('should return safe message for unauthorized errors', () => {
      const error = { message: 'Request failed with status code 401' };
      expect(getErrorMessage(error)).toBe('You are not authorized to perform this action.');
    });

    it('should return default message for unknown errors', () => {
      const error = { message: 'Unknown error' };
      expect(getErrorMessage(error)).toBe('An error occurred. Please try again.');
    });

    it('should return default message for errors without response', () => {
      const error = {};
      expect(getErrorMessage(error)).toBe('An error occurred. Please try again.');
    });
  });
});
