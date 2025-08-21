import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Clock, Phone } from "lucide-react";
import { Agent } from "@/types/agent";

interface AgentTestInterfaceProps {
  agent: Agent;
  onClose: () => void;
}

export function AgentTestInterface({ agent, onClose }: AgentTestInterfaceProps) {
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
            content: "I'd be happy to help you with your account. Can you please tell me what specific issue you're experiencing?",
            timestamp: new Date()
          }]);
        }, 1500);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col animate-scale-in">
        {/* Header */}
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                <AvatarImage src={agent.avatar} />
                <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                  {agent.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{agent.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
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
              
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Chat Area */}
        <CardContent className="flex-1 p-6 flex">
          <div className="flex-1 flex flex-col">
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
                        ? 'bg-primary text-primary-foreground'
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
                    variant="gradient"
                    size="lg"
                    onClick={handleConnect}
                    className="gap-2"
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
                      <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-6 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                      <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                    </div>
                    <span className="text-sm">Listening...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Agent Info Sidebar */}
          <div className="w-80 ml-6 space-y-4 border-l border-border pl-6">
            <h3 className="font-semibold">Agent Details</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Voice Provider</h4>
                <p className="text-sm capitalize">
                  {agent.voice.provider === "hume" ? "VoiceCake" : agent.voice.provider}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Personality</h4>
                <p className="text-sm capitalize">{agent.personality.tone}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Available Tools</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agent.tools.map((tool) => (
                    <Badge key={tool} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Integrations</h4>
                <div className="space-y-1 mt-1">
                  {agent.integrations.whatsapp && (
                    <div className="flex items-center gap-2 text-xs">
                      <MessageSquare className="w-3 h-3" />
                      WhatsApp
                    </div>
                  )}
                  {agent.integrations.voice_calls && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="w-3 h-3" />
                      Voice Calls
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}