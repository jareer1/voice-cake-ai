import axios from "axios";
import config from "@/lib/config";

const api = axios.create({
  // baseURL: "/api-proxy",
  baseURL: config.api.baseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Only set Content-Type for non-FormData requests
    if (!(config.data instanceof FormData) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => { 
    return Promise.reject(error);
  }
); 

// Agent API functions
export const agentAPI = {
  createAgent: async (agentData: {
    name: string;
    voice_provider: string;
    voice_id: string;
    description: string;
    custom_instructions: string;
    model_provider: string;
    model_resource: string;
  }) => {
    const response = await api.post('/agents/', agentData);
    return response.data;
  },
  
  getAgents: async () => {
    const response = await api.get('/agents/');
    return response.data;
  },
  
  getAgent: async (id: string) => {
    const response = await api.get(`/agents/${id}`);
    return response.data;
  },
  
  updateAgent: async (id: string, agentData: {
    name: string;
    voice_provider: string;
    voice_id: string;
    description: string;
    custom_instructions: string;
    model_provider: string;
    model_resource: string;
  }) => {
    const response = await api.put(`/agents/${id}`, agentData);
    return response.data;
  },
  
  deleteAgent: async (id: string) => {
    const response = await api.delete(`/agents/${id}`);
    return response.data;
  }
};

// Auth API functions
export const authAPI = {
  requestPasswordReset: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { 
      token, 
      new_password: newPassword 
    });
    return response.data;
  }
};

export default api; 