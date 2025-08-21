import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentTestInterface } from "@/components/agents/AgentTestInterface";
import { CreateAgentModal } from "@/components/modals/CreateAgentModal";
import { EditAgentModal } from "@/components/modals/EditAgentModal";
import { Plus, Bot, Users, Clock, TrendingUp, Loader2 } from "lucide-react";
import { Agent } from "@/types/agent";
import { useFinance } from "@/context/financeContext";
import { agentAPI } from "./services/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";


export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingAgent, setTestingAgent] = useState<Agent | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { activeSubscriptions, refreshSubscriptions } = useFinance();

  // Fetch agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        setError(null);
        const agentsData = await agentAPI.getAgents();
        setAgents(agentsData);
      } catch (err: any) {
        console.error("Error fetching agents:", err);
        setError(err.message || "Failed to fetch agents");
        toast.error("Failed to load agents");
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  useEffect(() => {
    refreshSubscriptions();
  }, [refreshSubscriptions]);

  const stats = [
    {
      title: "Total Agents",
      value: loading ? "..." : agents.length.toString(),
      icon: "total-agents",
      iconBgColor: "#FF6692",
      cardColor: "#FFD9E4",
      trend: loading ? "" : "Empth 7. Conversa 5"
    },
    {
      title: "Automation Active",
      value: "27",
      icon: "automation",
      iconBgColor: "#8965E5",
      cardColor: "#E7E2F3",
      trend: "Empth 7. Conversa 5"
    },
    {
      title: "Minutes Remaining", 
      value: "300",
      icon: "clock",
      iconBgColor: "#00CEB6",
      cardColor: "#BAFAF2",
      trend: "TTS Tokens"
    },
    {
      title: "Top Trigger",
      value: "Call Ended",
      icon: "call",
      iconBgColor: "#FF6692",
      cardColor: "#FFD9E4",
      trend: "Empth 7. Conversa 5"
    }
  ];

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsEditModalOpen(true);
  };

  const handleDeleteAgent = async (agent: Agent) => {
    if (window.confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`)) {
      try {
        await agentAPI.deleteAgent(agent.id.toString());
        toast.success("Agent deleted successfully!");
        // Refresh the agents list
        const updatedAgents = agents.filter(a => a.id !== agent.id);
        setAgents(updatedAgents);
      } catch (error: any) {
        console.error("Error deleting agent:", error);
        const errorMessage = error.response?.data?.message || error.message || "Failed to delete agent";
        toast.error(errorMessage);
      }
    }
  };

  const handleAgentUpdate = (updatedAgent: Agent) => {
    // Update the agent in the local state
    setAgents(prev => prev.map(agent => 
      agent.id === updatedAgent.id ? updatedAgent : agent
    ));
  };

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#111C2D99' }}>Dashboard</h1>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="hover:shadow-md transition-shadow animate-fade-in relative overflow-hidden border-0" 
            style={{ 
              animationDelay: `${index * 0.1}s`,
              backgroundColor: stat.cardColor
            }}
          >
            {/* Pattern overlay in top right */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <div className="w-full h-full bg-black rounded-full transform translate-x-12 -translate-y-12"></div>
            </div>
            
            <CardHeader className="flex flex-col items-start space-y-0 pb-2">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: stat.iconBgColor }}
              >
                <img 
                  src={`/${stat.icon}.svg`} 
                  alt={stat.title} 
                  className="w-6 h-6"
                />
              </div>
              <CardTitle className="text-sm font-medium text-gray-700">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-700">{stat.value}</div>
              <p className="text-xs text-gray-600 mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Agents and Live Activity - Side by Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Your Agents Section - 60% width (3/5 columns) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Agents</h2>
            <Button variant="ghost" size="sm" className="p-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </Button>
          </div>
          
          {loading ? (
            <Card className="p-12 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-muted-foreground">Loading agents...</span>
              </div>
            </Card>
          ) : error ? (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground space-y-2">
                <p className="text-lg text-destructive">Error loading agents</p>
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </Card>
          ) : agents.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground space-y-2">
                <p className="text-lg">No agents found</p>
                <p>Create your first agent to get started</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {agents.slice(0, 2).map((agent, index) => (
                <Card key={agent.id} className="hover:shadow-md transition-shadow animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900">{agent.name}</h3>
                          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Empth
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Nova 2 Numbers</p>
                        <div className="space-y-2">
                          <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">+12025550123</span>
                          </div>
                          <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">+12025550123</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Live Activity Section - 40% width (2/5 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Live Activity</h2>
          
          <Card className="p-4">
            <div className="space-y-3">
              {/* Empth Activity */}
              <div className="flex items-start gap-3 p-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    Empth Call answered on supportbot via +1202220123
                  </p>
                </div>
              </div>

              {/* Automation Activity */}
              <div className="flex items-start gap-3 p-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    Automation Lead Follow-up executed.success
                  </p>
                </div>
              </div>

              {/* Conversa Activity */}
              <div className="flex items-start gap-3 p-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    Conversa synthesis used 12 tokens
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-3"></div>

              {/* View All Button */}
              <Button className="w-full btn-theme-gradient border-theme-primary hover:border-theme-secondary">
                View All Live Activity
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => {
          console.log('Creating agent:', data);
          setIsCreateModalOpen(false);
          // Add the new agent to the list
          setAgents(prev => [...prev, data]);
        }}
      />
      
      <EditAgentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAgent(null);
        }}
        onSubmit={handleAgentUpdate}
        agent={selectedAgent}
      />

      {testingAgent && (
        <AgentTestInterface
          agent={testingAgent}
          onClose={() => setTestingAgent(null)}
        />
      )}
    </div>
  );
}