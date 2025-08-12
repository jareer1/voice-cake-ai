import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AgentCard } from "@/components/agents/AgentCard";
import { CreateAgentModal } from "@/components/modals/CreateAgentModal";
import { EditAgentModal } from "@/components/modals/EditAgentModal";
import { Plus, Search, Filter, Grid, List, Loader2 } from "lucide-react";
import { Agent } from "@/types/agent";
import agentsService from "./services/agents";
import { agentAPI } from "./services/api";
import { toast } from "sonner";

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Fetch agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        setError(null);
        const agentsData = await agentsService.getAgents();
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

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || agent.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: "all", label: "All Status", count: agents.length },
    { value: "active", label: "Active", count: agents.filter(a => a.status === "active").length },
    { value: "inactive", label: "Inactive", count: agents.filter(a => a.status === "inactive").length },
    { value: "training", label: "Training", count: agents.filter(a => a.status === "training").length },
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
          <h1 className="text-3xl font-bold text-foreground">Agents</h1>
          <p className="text-muted-foreground">Manage and monitor your AI voice agents</p>
        </div>
        <Button 
          variant="outline"
          size="lg" 
          className="gap-2 btn-theme-gradient border-theme-primary hover:border-theme-secondary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-5 h-5" />
          Create Agent
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'outline' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' 
                  ? "btn-theme-gradient border-theme-primary hover:border-theme-secondary" 
                  : "hover:btn-theme-gradient hover:border-theme-primary"
                }
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'outline' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' 
                  ? "btn-theme-gradient border-theme-primary hover:border-theme-secondary" 
                  : "hover:btn-theme-gradient hover:border-theme-primary"
                }
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <Badge
                key={option.value}
                variant="outline"
                className={`cursor-pointer transition-all duration-300 ${
                  selectedStatus === option.value 
                    ? "badge-theme-gradient border-theme-primary hover:border-theme-secondary" 
                    : "hover:badge-theme-gradient hover:border-theme-primary"
                }`}
                onClick={() => setSelectedStatus(option.value)}
              >
                {option.label} ({option.count})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agents Grid/List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {loading ? "Loading..." : `${filteredAgents.length} Agent${filteredAgents.length !== 1 ? 's' : ''}`}
          </h2>
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
        ) : filteredAgents.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground space-y-2">
              <p className="text-lg">No agents found</p>
              <p>Try adjusting your search or filters</p>
            </div>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            : "space-y-4"
          }>
            {filteredAgents.map((agent, index) => (
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
    </div>
  );
}