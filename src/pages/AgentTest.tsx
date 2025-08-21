import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Clock, Phone, ArrowLeft } from "lucide-react";
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

export default function AgentTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    type: 'agent' | 'user' | 'system';
    content: string;
    timestamp: Date;
  }>>([
    {
      id: '1',
      type: 'agent',
      content: "Hello! I'm your AI assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);

  // Find the agent by ID
  const agent = mockAgents.find(a => a.id === id);

  useEffect(() => {
    if (!agent) {
      navigate('/agents');
      return;
    }
  }, [agent, navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => {
        setSessionTime(time => time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConnect = () => {
    setIsConnected(true);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'system',
      content: 'Connected to agent',
      timestamp: new Date()
    }]);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsRecording(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'system',
      content: 'Disconnected from agent',
      timestamp: new Date()
    }]);
  };

  const toggleRecording = () => {
    if (!isConnected) return;
    
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Simulate user message
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'user',
          content: "Hello, I need help with my account",
          timestamp: new Date()
        }]);
        
        // Simulate agent response
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            type: 'agent',
            content: "I'd be happy to help you with your account. Can you tell me specifically what specific issue you're experiencing?",
            timestamp: new Date()
          }]);
        }, 1500);
      }, 2000);
    }
  };

  if (!agent) {
    return null;
  }

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/agents')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Agents
        </Button>
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12 ring-2 ring-primary/20">
            <AvatarImage src={agent.avatar} />
            <AvatarFallback className="avatar-theme-gradient text-white font-semibold">
              {agent.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{agent.name}</h1>
            <p className="text-muted-foreground">{agent.description}</p>
          </div>
        </div>
        
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="text-sm">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {isConnected && (
            <Badge variant="secondary" className="gap-2">
              <Clock className="w-3 h-3" />
              {formatTime(sessionTime)}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-xl">Live Conversation</CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 p-6 flex flex-col">
              {/* Messages */}
              <div className="flex-1 space-y-4 mb-6 overflow-y-auto scrollbar-thin">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'btn-theme-gradient'
                          : message.type === 'agent'
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-muted text-muted-foreground text-center text-sm'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-center gap-4">
                  {!isConnected ? (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleConnect}
                      className="gap-2 btn-theme-gradient border-theme-primary hover:border-theme-secondary"
                    >
                      <Phone className="w-5 h-5" />
                      Connect to Agent
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="icon-lg"
                        onClick={() => setIsMuted(!isMuted)}
                        className={isMuted ? "text-destructive" : ""}
                      >
                        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </Button>

                      <Button
                        variant={isRecording ? "destructive" : "default"}
                        size="xl"
                        onClick={toggleRecording}
                        className="gap-3 min-w-[200px]"
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="w-6 h-6" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="w-6 h-6" />
                            Hold to Speak
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleDisconnect}
                        className="gap-2"
                      >
                        Disconnect
                      </Button>
                    </>
                  )}
                </div>

                {isRecording && (
                  <div className="text-center mt-4">
                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                      <div className="flex gap-1">
                        <div className="w-1 h-4 bg-slate-700 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-6 bg-slate-700 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-5 bg-slate-700 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                        <div className="w-1 h-4 bg-slate-700 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                      </div>
                      <span className="text-sm">Listening...</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Info Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Agent Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                <Badge 
                  variant={agent.status === 'active' ? 'outline' : agent.status === 'training' ? 'secondary' : 'outline'}
                  className={agent.status === 'active' ? 'badge-theme-gradient border-theme-primary' : ''}
                >
                  {agent.status}
                </Badge>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Voice Provider</h4>
                <p className="text-sm capitalize">
                  {agent.voice.provider === "hume" ? "VoiceCake" : agent.voice.provider}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Personality</h4>
                <p className="text-sm capitalize">{agent.personality.tone} • {agent.personality.style}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Available Tools</h4>
                <div className="flex flex-wrap gap-1">
                  {agent.tools.map((tool) => (
                    <Badge key={tool} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Integrations</h4>
                <div className="space-y-2">
                  {agent.integrations.whatsapp && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="w-4 h-4 text-green-500" />
                      WhatsApp
                    </div>
                  )}
                  {agent.integrations.voice_calls && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-blue-500" />
                      Voice Calls
                    </div>
                  )}
                  {agent.integrations.web && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="w-4 h-4 text-slate-600" />
                      Web Chat
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Analytics</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Sessions:</span>
                    <span className="font-medium">{agent.totalSessions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Length:</span>
                    <span className="font-medium">{agent.analytics.avgSessionLength}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Satisfaction:</span>
                    <span className="font-medium">{agent.analytics.satisfactionScore}/5</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
