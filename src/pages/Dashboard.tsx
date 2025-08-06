import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentTestInterface } from "@/components/agents/AgentTestInterface";
import { CreateAgentModal } from "@/components/modals/CreateAgentModal";
import { Plus, Bot, Users, Clock, TrendingUp } from "lucide-react";
import { Agent } from "@/types/agent";

// Mock data
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
  }
];

export default function Dashboard() {
  const [agents] = useState<Agent[]>(mockAgents);
  const [testingAgent, setTestingAgent] = useState<Agent | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const stats = [
    {
      title: "Total Agents",
      value: agents.length.toString(),
      icon: Bot,
      trend: "+2 this week"
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

      {/* Recent Agents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Agents</h2>
          <Button variant="outline" size="sm">View All</Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {agents.map((agent, index) => (
            <div key={agent.id} className="animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <AgentCard 
                agent={agent}
                onEdit={(agent) => console.log('Editing agent:', agent.name)}
              />
            </div>
          ))}
        </div>
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

      {testingAgent && (
        <AgentTestInterface
          agent={testingAgent}
          onClose={() => setTestingAgent(null)}
        />
      )}
    </div>
  );
}