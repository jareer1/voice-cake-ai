import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AgentCard } from "@/components/agents/AgentCard";
import { CreateAgentModal } from "@/components/modals/CreateAgentModal";
import { Plus, Search, Filter, Grid, List } from "lucide-react";
import { Agent } from "@/types/agent";

// Mock data - in real app this would come from API
const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Customer Support AI",
    description: "Handles customer inquiries and support tickets with empathy and efficiency",
    status: "active",
    voice: {
      provider: "elevenlabs",
      voiceId: "voice_123",
      settings: { speed: 1.0, stability: 0.8 }
    },
    tools: ["Knowledge Base", "Ticket System", "CRM Integration"],
    personality: {
      tone: "helpful",
      style: "professional", 
      instructions: "Be empathetic and solution-focused"
    },
    integrations: { whatsapp: true, voice_calls: true, web: true },
    analytics: { totalSessions: 2847, avgSessionLength: 3.2, satisfactionScore: 4.8 },
    totalSessions: 2847,
    lastUsed: "2 hours ago",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20"
  },
  {
    id: "2",
    name: "Sales Assistant", 
    description: "Qualifies leads and schedules appointments with potential customers",
    status: "active",
    voice: {
      provider: "elevenlabs",
      voiceId: "voice_456",
      settings: { speed: 1.1, stability: 0.7 }
    },
    tools: ["Calendar", "CRM", "Product Catalog"],
    personality: {
      tone: "persuasive",
      style: "friendly",
      instructions: "Focus on understanding customer needs"
    },
    integrations: { whatsapp: true, voice_calls: true, web: false },
    analytics: { totalSessions: 1204, avgSessionLength: 5.1, satisfactionScore: 4.6 },
    totalSessions: 1204,
    lastUsed: "1 day ago",
    createdAt: "2024-01-10", 
    updatedAt: "2024-01-18"
  },
  {
    id: "3",
    name: "HR Onboarding Bot",
    description: "Guides new employees through the onboarding process and answers HR questions",
    status: "training",
    voice: {
      provider: "elevenlabs",
      voiceId: "voice_789",
      settings: { speed: 0.9, stability: 0.9 }
    },
    tools: ["Employee Database", "Document Manager", "Training Modules"],
    personality: {
      tone: "welcoming",
      style: "informative", 
      instructions: "Be patient and thorough in explanations"
    },
    integrations: { whatsapp: false, voice_calls: true, web: true },
    analytics: { totalSessions: 89, avgSessionLength: 7.5, satisfactionScore: 4.9 },
    totalSessions: 89,
    lastUsed: "3 days ago",
    createdAt: "2024-01-08",
    updatedAt: "2024-01-16"
  }
];

export default function Agents() {
  const [agents] = useState<Agent[]>(mockAgents);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
            {filteredAgents.length} Agent{filteredAgents.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {filteredAgents.length === 0 ? (
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
                  onEdit={(agent) => console.log('Editing agent:', agent.name)}
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
        }}
      />
    </div>
  );
}