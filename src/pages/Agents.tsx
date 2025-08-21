import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateAgentModal } from "@/components/modals/CreateAgentModal";
import { EditAgentModal } from "@/components/modals/EditAgentModal";
import { ShareAgentModal } from "@/components/modals/ShareAgentModal";
import { Plus, MoreHorizontal, Edit, Share2, Trash2, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Agent } from "@/types/agent";
import agentsService from "./services/agents";
import { agentAPI } from "./services/api";
import { toast } from "sonner";

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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
    const matchesType = selectedType === "all" || agent.type === selectedType;
    const matchesStatus = selectedStatus === "all" || agent.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  const typeOptions = [
    { value: "all", label: "All Type" },
    { value: "empth", label: "Empth" },
    { value: "conversa", label: "Conversa" },
  ];

  const statusOptions = [
    { value: "all", label: "Status All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "training", label: "Training" },
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

  const handleShareAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsShareModalOpen(true);
  };

  const handleQuickTest = (agent: Agent) => {
    // Navigate to the inference screen for testing
    window.location.href = `/inference/${agent.id}`;
  };

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#111C2D99' }}>Agents</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-32 bg-white rounded-md">
                <SelectValue placeholder="All Type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32 bg-white rounded-md">
                <SelectValue placeholder="Status All" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            size="lg" 
            className="gap-2 btn-theme-gradient border-theme-primary hover:border-theme-secondary rounded-full px-6"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-5 h-5" />
            Create Assistant
          </Button>
        </div>
      </div>

      {/* Agents Table */}
      <Card className="border-0 shadow-sm bg-background">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 bg-white">
                <TableHead className="font-medium text-gray-700 py-6 w-1/4">Name</TableHead>
                <TableHead className="font-medium text-gray-700 py-6 w-1/6">Type</TableHead>
                <TableHead className="font-medium text-gray-700 py-6 w-1/6">Status</TableHead>
                <TableHead className="font-medium text-gray-700 py-6 w-1/6">Voice</TableHead>
                <TableHead className="font-medium text-gray-700 py-6 w-1/6">Number</TableHead>
                <TableHead className="font-medium text-gray-700 py-6 w-1/6">Automation</TableHead>
                <TableHead className="font-medium text-gray-700 py-6 w-20">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      <span className="text-gray-600">Loading agents...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="text-gray-600 space-y-2">
                      <p className="text-lg text-red-600">Error loading agents</p>
                      <p>{error}</p>
                      <Button 
                        variant="outline" 
                        onClick={() => window.location.reload()}
                        className="mt-4"
                      >
                        Try Again
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="text-gray-600 space-y-2">
                      <p className="text-lg">No agents found</p>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgents.map((agent, index) => (
                  <TableRow key={agent.id} className="bg-background border-b border-gray-200">
                    <TableCell className="py-4">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 truncate">{agent.name}</div>
                        {agent.description && (
                          <div className="text-sm text-gray-500 truncate">{agent.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-gray-700">{agent.type || 'Empth'}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge className="bg-green-100 text-green-800 border-0 px-3 py-1">
                        {agent.status === 'active' ? 'Active' : agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-gray-700">
                        {typeof agent.voice === 'string' ? agent.voice : agent.voice?.voiceId || 'Nova'}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-gray-700">$275</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-gray-700">$275</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleQuickTest(agent)}>
                            <Play className="mr-2 h-4 w-4" />
                            Quick Test
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditAgent(agent)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareAgent(agent)}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteAgent(agent)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
      
      <ShareAgentModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setSelectedAgent(null);
        }}
        agent={selectedAgent}
      />
    </div>
  );
}