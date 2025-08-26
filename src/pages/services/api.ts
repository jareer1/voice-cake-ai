import axios from "axios";
import config from "@/lib/config";
import { VoiceCloneCreate, VoiceCloneResponse } from "@/types/voice";
import { toast } from "sonner";
import { 
  handleRefreshTokenExpiration, 
  isRefreshTokenExpired, 
  isRateLimitError,
  getErrorMessage,
  safeLogError,
  ErrorCode
} from "@/utils/authUtils";

// Utility function to handle standardized backend responses
const handleApiResponse = (response: any, fallback?: any) => {
  if (response.data && typeof response.data === 'object') {
    if (response.data.success === true && response.data.data !== undefined) {
      return response.data.data;
    }
    if (!response.data.success && response.data.message) {
      throw new Error(response.data.message);
    }
  }
  return fallback !== undefined ? fallback : response.data;
};

const api = axios.create({
  // baseURL: "/api-proxy",
  baseURL: config.api.baseURL,
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

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

// Response interceptor for automatic token refresh and rate limiting
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle rate limiting (429 status code)
    if (isRateLimitError(error)) {
      const responseData = error.response?.data;
      
      // Use standardized error message if available
      if (responseData?.success === false && responseData?.message) {
        toast.error(responseData.message, {
          duration: 5000,
          position: "top-right"
        });
      } else {
        // Fallback to generic rate limit message
        const retryAfter = responseData?.retry_after || error.response?.headers['retry-after'] || 60;
        toast.error(
          `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
          {
            duration: 5000,
            position: "top-right"
          }
        );
      }
      
      return Promise.reject(error);
    }
    
    // If error is 401 and we haven't tried to refresh yet
    // Skip token refresh for authentication requests to allow proper error handling
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        
        const response = await authAPI.refreshToken(refreshToken);
        
        const { access_token, refresh_token } = response.success ? response.data : response;
        
        // Update tokens in localStorage
        localStorage.setItem("authToken", access_token);
        localStorage.setItem("refreshToken", refresh_token);
        
        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        // Process queued requests
        processQueue(null, access_token);
        
        return api(originalRequest);
      } catch (refreshError: any) {
        // Refresh failed - check if it's due to expired refresh token
        const refreshTokenExpired = isRefreshTokenExpired(refreshError);
        
        // Safe logging without exposing sensitive data
        safeLogError(refreshError, 'Token Refresh Failed');
        
        // Process queued requests with error
        processQueue(refreshError, null);
        
        // Handle refresh token expiration
        if (refreshTokenExpired) {
          handleRefreshTokenExpiration();
        } else {
          // For other authentication errors, show user-friendly message
          const errorMessage = getErrorMessage(refreshError);
          toast.error(errorMessage, {
            duration: 5000,
            position: "top-right"
          });
          
          // Clear tokens and redirect
          localStorage.removeItem("authToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          localStorage.removeItem("userId");
          localStorage.removeItem("username");
          localStorage.removeItem("email");
          
          setTimeout(() => {
            window.location.href = "/auth/signin";
          }, 1000);
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
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
    agent_type: string;
    tool_ids?: string[];
  }) => {
    const response = await api.post('/agents/', agentData);
    return handleApiResponse(response);
  },
  
  getAgents: async () => {
    const response = await api.get('/agents/');
    return handleApiResponse(response, []);
  },
  
  getAgent: async (id: string) => {
    const response = await api.get(`/agents/${id}`);
    return handleApiResponse(response);
  },
  
  updateAgent: async (id: string, agentData: {
    name: string;
    voice_provider: string;
    voice_id: string;
    description: string;
    custom_instructions: string;
    model_provider: string;
    model_resource: string;
    agent_type: string;
    tool_ids?: string[];
  }) => {
    const response = await api.put(`/agents/${id}`, agentData);
    return handleApiResponse(response);
  },
  
  deleteAgent: async (id: string) => {
    const response = await api.delete(`/agents/${id}`);
    return handleApiResponse(response);
  }
};

// Tools API functions
export const toolsAPI = {
  getTools: async () => {
    const response = await api.get('/tools/');
    return handleApiResponse(response, []);
  }
};

// Auth API functions
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return handleApiResponse(response);
  },
  
  signup: async (email: string, username: string, password: string) => {
    const response = await api.post('/auth/register', { email, username, password });
    return handleApiResponse(response);
  },
  
  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return handleApiResponse(response);
  },
  
  logout: async (refreshToken: string) => {
    const response = await api.post('/auth/logout', { refresh_token: refreshToken });
    return handleApiResponse(response);
  },
  
  requestPasswordReset: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return handleApiResponse(response);
  },
  
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { 
      token, 
      new_password: newPassword 
    });
    return handleApiResponse(response);
  }
};

// Voice Clone API functions
export const voiceCloneAPI = {
  getVoiceClones: async (): Promise<VoiceCloneResponse[]> => {
    const response = await api.get('/voice-clones/');
    return handleApiResponse(response, []) as VoiceCloneResponse[];
  },
  
  getVoiceClone: async (id: number): Promise<VoiceCloneResponse> => {
    const response = await api.get(`/voice-clones/${id}`);
    return handleApiResponse(response) as VoiceCloneResponse;
  },
  
  deleteVoiceClone: async (id: string): Promise<void> => {
    const response = await api.delete(`/voice-clones/${id}`);
    return handleApiResponse(response);
  },
  
  // Create voice clone with audio file (required by backend)
  createVoiceCloneWithAudio: async (
    voiceCloneData: VoiceCloneCreate, 
    audioFile: File
  ): Promise<VoiceCloneResponse> => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('name', voiceCloneData.name);
    if (voiceCloneData.description) {
      formData.append('description', voiceCloneData.description);
    }
    if (voiceCloneData.language) {
      formData.append('language', voiceCloneData.language);
    }
    
    const response = await api.post('/voice-clones/', formData);
    return handleApiResponse(response) as VoiceCloneResponse;
  }
};

// LiveKit API functions
export const liveKitAPI = {
  createSession: async (agentId: string, participantName?: string) => {
    const response = await api.post('/livekit/session/start', {
      agent_id: agentId,
      participant_name: participantName || `User_${Date.now()}`
    });
    return handleApiResponse(response);
  }
};

export default api; 