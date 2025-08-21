import axios from "axios";
import config from "@/lib/config";

const publicApi = axios.create({
  baseURL: config.api.baseURL,
});

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
