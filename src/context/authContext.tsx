import React, { createContext, useState, useContext, useEffect } from "react";
import api, { authAPI } from "../pages/services/api";
import { isRefreshTokenExpired } from "@/utils/authUtils";

interface AuthContextType {
  user: any;
  token: string | null;
  refreshToken: string | null;
  login: (username: string, password: string) => Promise<any>;
  signup: (email: string, username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<any>;
  resetPassword: (token: string, newPassword: string) => Promise<any>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedRefreshToken && storedUser) {
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await authAPI.login(username, password);
      
      // Handle new response format with success wrapper
      const responseData = res.success ? res.data : res;
      
      const { access_token, refresh_token, user: userData } = responseData;
      
      // Store tokens and user data
      setToken(access_token);
      setRefreshToken(refresh_token);
      setUser(userData);
      
      // Store in localStorage
      localStorage.setItem("authToken", access_token);
      localStorage.setItem("refreshToken", refresh_token);
      localStorage.setItem("user", JSON.stringify(userData));
      
      return res;
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || "Login failed");
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    try {
      const res = await api.post("/auth/register", { email, username, password });
      setToken(res.data.access_token);
      setUser(res.data.user);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || "Signup failed");
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const currentRefreshToken = refreshToken || localStorage.getItem("refreshToken");
      
      if (!currentRefreshToken) {
        console.log("❌ No refresh token available for refresh");
        return false;
      }

      const res = await authAPI.refreshToken(currentRefreshToken);
      
      // Handle new response format with success wrapper
      const responseData = res.success ? res.data : res;
      
      const { access_token, refresh_token } = responseData;
      
      // Update tokens
      setToken(access_token);
      setRefreshToken(refresh_token);
      
      // Update localStorage
      localStorage.setItem("authToken", access_token);
      localStorage.setItem("refreshToken", refresh_token);
      
      console.log("✅ Token refresh successful");
      return true;
    } catch (err: any) {
      console.error("❌ Token refresh failed:", err);
      
      // Check if it's due to expired refresh token
      const refreshTokenExpired = isRefreshTokenExpired(err);
      
      console.log('🔄 Refresh token expired check:', {
        status: err.response?.status,
        message: err.message,
        detail: err.response?.data?.detail,
        isRefreshTokenExpired: refreshTokenExpired
      });
      
      // Clear invalid tokens
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      
      // If refresh token is expired, redirect to login
      if (refreshTokenExpired) {
        console.log("🔄 Refresh token expired, redirecting to login");
        // The API interceptor will handle the redirect and toast message
      }
      
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const currentRefreshToken = refreshToken || localStorage.getItem("refreshToken");
      
      console.log("🔐 Starting logout process...");
      console.log("📝 Refresh token exists:", !!currentRefreshToken);
      
      if (currentRefreshToken) {
        console.log("📡 Calling logout API endpoint...");
        // Call logout endpoint to revoke refresh token
        const response = await authAPI.logout(currentRefreshToken);
        console.log("✅ Logout API response:", response);
      } else {
        console.log("⚠️ No refresh token found, skipping API call");
      }
    } catch (err: any) {
      console.error("❌ Logout API call failed:", err);
      console.error("❌ Error details:", err.response?.data || err.message);
      // Continue with local logout even if API call fails
    } finally {
      console.log("🧹 Clearing local state and storage...");
      // Clear local state and storage
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      console.log("✅ Logout completed");
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const res = await authAPI.requestPasswordReset(email);
      return res;
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || "Password reset request failed");
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const res = await authAPI.resetPassword(token, newPassword);
      return res;
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || "Password reset failed");
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      refreshToken,
      login, 
      signup, 
      logout, 
      refreshAccessToken,
      requestPasswordReset, 
      resetPassword,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};