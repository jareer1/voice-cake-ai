import React, { createContext, useState, useContext } from "react";
import api from "../pages/services/api";

interface AuthContextType {
  user: any;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = async (username: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { username, password });
      setToken(res.data.access_token);
      setUser(res.data.user);
      return res.data
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

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};