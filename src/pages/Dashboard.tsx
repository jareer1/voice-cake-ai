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
      icon: Bot,
      trend: loading ? "" : `${agents.length} total`
    },
    {
      title: "Active Sessions",
      value: "47",
      icon: Users,
      trend: "+12% from yesterday"
    },
    {
      title: "Avg Session Time", 
      value: "4.2m",
      icon: Clock,
      trend: "+0.3m from last week"
    },
    {
      title: "Satisfaction Score",
      value: "4.7/5",
      icon: TrendingUp,
      trend: "+0.2 from last month"
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
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Manage your AI voice agents and monitor performance</p>
        </div>
        <Button 
          size="lg" 
          className="gap-2 btn-theme-gradient border border-theme-primary hover:border-theme-secondary hover:shadow-lg"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-5 h-5" />
          Create Agent
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-success mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeSubscriptions.conversa && (
          <Card>
            <CardHeader>
              <CardTitle>Conversa Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">{activeSubscriptions.conversa.plan.name}</div>
              <div className="text-lg font-semibold">Minutes left: {activeSubscriptions.conversa.minutes_left}</div>
              <div className="text-sm">Expires: {new Date(activeSubscriptions.conversa.expires_at).toLocaleDateString()}</div>
            </CardContent>
          </Card>
        )}
        {activeSubscriptions.empath && (
          <Card>
            <CardHeader>
              <CardTitle>Empath Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">{activeSubscriptions.empath.plan.name}</div>
              <div className="text-lg font-semibold">Minutes left: {activeSubscriptions.empath.minutes_left}</div>
              <div className="text-sm">Expires: {new Date(activeSubscriptions.empath.expires_at).toLocaleDateString()}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Agents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Agents</h2>
          <Button variant="outline" size="sm">View All</Button>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {agents.map((agent, index) => (
              <div key={agent.id} className="animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <AgentCard 
                  agent={agent}
                  onEdit={handleEditAgent}
                  onDelete={handleDeleteAgent}
                />
              </div>
            ))}
          </div>
        )}
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