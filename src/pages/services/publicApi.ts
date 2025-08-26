import axios from "axios";
import config from "@/lib/config";
import { toast } from "sonner";

const publicApi = axios.create({
  baseURL: config.api.baseURL,
});

// Response interceptor for rate limiting
publicApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle rate limiting (429 status code)
    if (error.response?.status === 429) {
      const responseData = error.response.data;
      
      // Check if it's our specific rate limiting response format
      if (responseData && responseData.success === false && responseData.message === "Too many requests. Please try again later.") {
        const retryAfter = responseData.retry_after || 60;
        
        toast.error(
          `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
          {
            duration: 5000,
            position: "top-right"
          }
        );
        
        return Promise.reject(error);
      }
      
      // Handle other rate limiting responses
      const retryAfter = responseData?.retry_after || error.response.headers['retry-after'] || 60;
      
      toast.error(
        `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
        {
          duration: 5000,
          position: "top-right"
        }
      );
      
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// Public API functions that don't require authentication
export const publicAgentAPI = {
  getAgent: async (id: string) => {
    try {
      // First try the public endpoint
      const response = await publicApi.get(`/agents/${id}/public`);
      return response.data;
    } catch (error: any) {
      console.log("Public endpoint failed, trying regular endpoint:", error.response?.status);
      // If public endpoint doesn't exist (404), try the regular endpoint
      if (error.response?.status === 404) {
        const response = await publicApi.get(`/agents/${id}`);
        return response.data;
      }
      throw error;
    }
  },

  // Public LiveKit session creation for TEXT agents
  createLiveKitSession: async (agentId: string) => {
    try {
      // First try the public endpoint
      const response = await publicApi.post(`/livekit/session/start/public`, {
        agent_id: agentId,
        participant_name: `PublicUser_${Date.now()}` // Auto-generated participant name for public users
      });
      return response.data;
    } catch (error: any) {
      console.log("Public LiveKit endpoint failed, trying regular endpoint:", error.response?.status);
      // If public endpoint doesn't exist (404), try the regular endpoint without auth
      if (error.response?.status === 404) {
        const response = await publicApi.post(`/livekit/session/start`, {
          agent_id: agentId,
          participant_name: `PublicUser_${Date.now()}`
        });
        return response.data;
      }
      throw error;
    }
  },
};

export default publicApi;
