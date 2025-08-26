import { isRefreshTokenExpired, isAuthenticationError } from '../authUtils';

describe('authUtils', () => {
  describe('isRefreshTokenExpired', () => {
    it('should return true for 401 status', () => {
      const error = { response: { status: 401 } };
      expect(isRefreshTokenExpired(error)).toBe(true);
    });

    it('should return true for 422 status', () => {
      const error = { response: { status: 422 } };
      expect(isRefreshTokenExpired(error)).toBe(true);
    });

    it('should return true for error message containing "expired"', () => {
      const error = { message: 'Token has expired' };
      expect(isRefreshTokenExpired(error)).toBe(true);
    });

    it('should return true for response detail containing "expired"', () => {
      const error = { response: { data: { detail: 'Refresh token expired' } } };
      expect(isRefreshTokenExpired(error)).toBe(true);
    });

    it('should return true for response message containing "expired"', () => {
      const error = { response: { data: { message: 'Token expired' } } };
      expect(isRefreshTokenExpired(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = { response: { status: 500, data: { detail: 'Internal server error' } } };
      expect(isRefreshTokenExpired(error)).toBe(false);
    });
  });

  describe('isAuthenticationError', () => {
    it('should return true for 401 status', () => {
      const error = { response: { status: 401 } };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true for 403 status', () => {
      const error = { response: { status: 403 } };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true for error message containing "unauthorized"', () => {
      const error = { message: 'User is unauthorized' };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return true for error message containing "forbidden"', () => {
      const error = { message: 'Access forbidden' };
      expect(isAuthenticationError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = { response: { status: 500, data: { detail: 'Internal server error' } } };
      expect(isAuthenticationError(error)).toBe(false);
    });
  });
});
