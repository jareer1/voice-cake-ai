import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare } from "lucide-react";
import useHumeInference, { INFERENCE_STATES } from "@/hooks/useHumeInference";

interface TextAgentDemoProps {
  agentId: string;
}

export function TextAgentDemo({ agentId }: TextAgentDemoProps) {
  const {
    inferenceState,
    isLoading,
    isConnected,
    isUserSpeaking,
    startInference,
    stopInference,
    sessionData,
  } = useHumeInference({
    agentId: agentId
  });

  const handleStartTextAgent = () => {
    if (!agentId) {
      alert("Agent ID is required");
      return;
    }
    startInference(agentId);
  };

  const handleStopTextAgent = () => {
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

  const isActive = inferenceState === "ACTIVE";
  const isConnecting = inferenceState === "CONNECTING";

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <MessageSquare className="w-6 h-6" />
          TEXT Agent Demo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Agent ID: {agentId}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="text-center space-y-2">
          <Badge variant={getStateColor(inferenceState)} className="text-sm">
            Status: {inferenceState}
          </Badge>
          
          {isConnected && (
            <Badge variant="outline" className="text-xs">
              ✅ LiveKit Session Active
            </Badge>
          )}
          
          {isUserSpeaking && (
            <Badge variant="default" className="animate-pulse bg-green-600 text-xs">
              🗣️ User Speaking
            </Badge>
          )}
        </div>

        {/* Connection Controls */}
        <div className="space-y-3">
          {!isConnected ? (
            <Button
              onClick={handleStartTextAgent}
              disabled={isLoading || isConnecting}
              className="w-full"
              size="lg"
            >
              {isConnecting ? '🔄 Starting Session...' : '🚀 Start TEXT Agent'}
            </Button>
          ) : (
            <Button
              onClick={handleStopTextAgent}
              variant="outline"
              className="w-full"
            >
              End Session
            </Button>
          )}
        </div>

        {/* Info */}
        <Alert>
          <AlertDescription className="text-xs">
            <strong>How it works:</strong><br/>
            • TEXT agents use LiveKit sessions (HTTP POST)<br/>
            • No WebSocket connection needed<br/>
            • Only requires agent ID to start<br/>
            • Text-to-speech handled automatically by LiveKit<br/>
            • Audio output managed by LiveKit room<br/>
            • <strong>Check browser console for detailed audio logs!</strong>
          </AlertDescription>
        </Alert>

        {/* Debug Info */}
        {isConnected && sessionData && (
          <Card className="bg-muted">
            <CardContent className="p-3 text-xs space-y-1">
              <p><strong>Agent ID:</strong> {agentId}</p>
              <p><strong>Session ID:</strong> {sessionData.session_id?.slice(0, 8)}...</p>
              <p><strong>Room:</strong> {sessionData.room_name}</p>
              <p><strong>Connection:</strong> LiveKit Room</p>
              <p><strong>Type:</strong> TEXT (Text-to-Speech)</p>
              <p><strong>Audio:</strong> Managed by LiveKit</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

export default TextAgentDemo;
