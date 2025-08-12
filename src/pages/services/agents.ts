import api from "./api";
import { Agent } from "@/types/agent";

export const agentsService = {
  // Get all agents
  getAgents: async (): Promise<Agent[]> => {
    try {
      const response = await api.get("/agents/");
      return response.data;
    } catch (error) {
      console.error("Error fetching agents:", error);
      throw error;
    }
  },

  // Get single agent by ID
  getAgent: async (id: number): Promise<Agent> => {
    try {
      const response = await api.get(`/agents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching agent ${id}:`, error);
      throw error;
    }
  },

  // Create new agent
  createAgent: async (agentData: Partial<Agent>): Promise<Agent> => {
    try {
      const response = await api.post("/agents/", agentData);
      return response.data;
    } catch (error) {
      console.error("Error creating agent:", error);
      throw error;
    }
  },

  // Update agent
  updateAgent: async (id: number, agentData: Partial<Agent>): Promise<Agent> => {
    try {
      const response = await api.put(`/agents/${id}`, agentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating agent ${id}:`, error);
      throw error;
    }
  },

  // Delete agent
  deleteAgent: async (id: number): Promise<void> => {
    try {
      await api.delete(`/agents/${id}`);
    } catch (error) {
      console.error(`Error deleting agent ${id}:`, error);
      throw error;
    }
  },
};

export default agentsService;
