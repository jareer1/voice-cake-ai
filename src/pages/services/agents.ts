import api from "./api";
import { Agent } from "@/types/agent";

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

export const agentsService = {
  // Get all agents
  getAgents: async (): Promise<Agent[]> => {
    try {
      const response = await api.get("/agents/");
      return handleApiResponse(response, []) as Agent[];
    } catch (error) {
      console.error("Error fetching agents:", error);
      throw error;
    }
  },

  // Get single agent by ID
  getAgent: async (id: number): Promise<Agent> => {
    try {
      const response = await api.get(`/agents/${id}`);
      return handleApiResponse(response) as Agent;
    } catch (error) {
      console.error(`Error fetching agent ${id}:`, error);
      throw error;
    }
  },

  // Create new agent
  createAgent: async (agentData: Partial<Agent>): Promise<Agent> => {
    try {
      const response = await api.post("/agents/", agentData);
      return handleApiResponse(response) as Agent;
    } catch (error) {
      console.error("Error creating agent:", error);
      throw error;
    }
  },

  // Update agent
  updateAgent: async (id: number, agentData: Partial<Agent>): Promise<Agent> => {
    try {
      const response = await api.put(`/agents/${id}`, agentData);
      return handleApiResponse(response) as Agent;
    } catch (error) {
      console.error(`Error updating agent ${id}:`, error);
      throw error;
    }
  },

  // Delete agent
  deleteAgent: async (id: number): Promise<void> => {
    try {
      const response = await api.delete(`/agents/${id}`);
      handleApiResponse(response);
    } catch (error) {
      console.error(`Error deleting agent ${id}:`, error);
      throw error;
    }
  },
};

export default agentsService;
