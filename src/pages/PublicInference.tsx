import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Volume2, 
  VolumeX,
  Loader2,
  Radio,
  Settings,
  ArrowLeft,
  Bot,
  Users,
  Clock
} from "lucide-react";
import useHumeInference, { INFERENCE_STATES } from "@/hooks/useHumeInference";
import { toast } from "sonner";
import { Agent } from "@/types/agent";
import { publicAgentAPI } from "./services/publicApi";

const PublicInference = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    inferenceState,
    isLoading,
    isMicOn,
    isConnected,
    isUserSpeaking,
    startInference,
    stopInference,
    toggleMic,
  } = useHumeInference({
    agentId: agentId
  });

  // Fetch agent details
  useEffect(() => {
    const fetchAgent = async () => {
      if (!agentId) {
        setError("Agent ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching agent with ID:", agentId);
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        
        const agentDataPromise = publicAgentAPI.getAgent(agentId);
        const agentData = await Promise.race([agentDataPromise, timeoutPromise]);
        
        console.log("Agent data received:", agentData);
        setAgent(agentData);
      } catch (err: any) {
        console.error("Error fetching agent:", err);
        console.error("Error details:", err.response?.data || err.message);
        
        let errorMessage = "Failed to fetch agent details";
        if (err.message === 'Request timeout') {
          errorMessage = "Request timed out. Please try again.";
        } else if (err.response?.status === 404) {
          errorMessage = "Agent not found or not publicly accessible.";
        } else if (err.response?.status === 401) {
          errorMessage = "Agent requires authentication.";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        toast.error("Failed to load agent");
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [agentId]);

  const handleStartInference = () => {
    if (!agentId) {
      toast.error("Agent ID is required");
      return;
    }
    startInference(agentId);
  };

  const handleStopInference = () => {
    stopInference();
  };

  const getStateColor = (state: keyof typeof INFERENCE_STATES) => {
    switch (state) {
      case "IDLE":
        return "secondary";
      case "CONNECTING":
        return "default";
      case "ACTIVE":
        return "default";
      case "ERROR":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStateIcon = (state: keyof typeof INFERENCE_STATES) => {
    switch (state) {
      case "IDLE":
        return <Square className="h-3 w-3" />;
      case "CONNECTING":
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case "ACTIVE":
        return <Radio className="h-3 w-3" />;
      case "ERROR":
        return <VolumeX className="h-3 w-3" />;
      default:
        return <Square className="h-3 w-3" />;
    }
  };

  const isActive = inferenceState === "ACTIVE";
  const isConnecting = inferenceState === "CONNECTING";

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-muted-foreground">Loading agent...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center space-y-4">
          <Alert className="max-w-md mx-auto">
            <AlertDescription>
              {error || "Agent not found"}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <Loader2 className="w-4 h-4" />
              Retry
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="absolute left-4 top-8 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Voice AI Chat</h1>
          <p className="text-muted-foreground">
            Chat with {agent.name} - a shared AI voice agent
          </p>
        </div>

        {/* Agent Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {agent.name}
            </CardTitle>
            <CardDescription>
              {agent.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{agent.total_sessions} sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{agent.last_used ? new Date(agent.last_used).toLocaleDateString() : 'Never used'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="capitalize">{agent.status}</span>
              </div>
            </div>
            {agent.tools && agent.tools.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {agent.tools.map((tool) => (
                    <Badge key={tool} variant="secondary" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Connection Status
                </CardTitle>
                <CardDescription>
                  Current state of the inference connection
                </CardDescription>
              </div>
              <Badge 
                variant={getStateColor(inferenceState)} 
                className={`flex items-center gap-1 ${
                  inferenceState === "ACTIVE" ? "bg-green-500 text-white hover:bg-green-600" : ""
                }`}
              >
                {getStateIcon(inferenceState)}
                {inferenceState}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isMicOn ? (
                  <Mic className="h-4 w-4 text-green-500" />
                ) : (
                  <MicOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">
                  Microphone {isMicOn ? 'On' : 'Off'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isUserSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-sm">
                  {isUserSpeaking ? 'Speaking' : 'Silent'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audio Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Audio Controls
            </CardTitle>
            <CardDescription>
              Control voice inference and microphone settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              {!isActive ? (
                <Button
                  onClick={handleStartInference}
                  disabled={!agentId || isLoading || isConnecting}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Chat
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={toggleMic}
                    variant={isMicOn ? "default" : "destructive"}
                    size="lg"
                    className="flex-1 sm:flex-none"
                  >
                    {isMicOn ? (
                      <>
                        <Mic className="mr-2 h-4 w-4" />
                        Mute
                      </>
                    ) : (
                      <>
                        <MicOff className="mr-2 h-4 w-4" />
                        Unmute
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleStopInference}
                    variant="destructive"
                    size="lg"
                    className="flex-1 sm:flex-none"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                </div>
              )}
            </div>

            {isActive && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Voice chat is active. Speak naturally to interact with {agent.name}.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicInference;
