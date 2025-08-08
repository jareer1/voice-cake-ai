import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  Settings
} from "lucide-react";
import useHumeInference, { INFERENCE_STATES } from "@/hooks/useHumeInference";
import { toast } from "sonner";
import config from "@/lib/config";

const Inference = () => {
  const { agentId: routeAgentId } = useParams();
  const [searchParams] = useSearchParams();
  const [manualAgentId, setManualAgentId] = useState("");
  // Get agent ID from route params or search params
  const agentIdFromParams = routeAgentId || searchParams.get('agent_id');
  const currentAgentId = agentIdFromParams || manualAgentId;

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
    agentId: currentAgentId
  });

  const handleStartInference = () => {
    if (!currentAgentId) {
      toast.error("Please provide an Agent ID");
      return;
    }
    startInference(currentAgentId);
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Voice AI Inference</h1>
          <p className="text-muted-foreground">
            Connect with Hume's voice AI for real-time conversation
          </p>
        </div>

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

        {/* Agent Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>
              Configure the agent for voice inference
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agentId">Agent ID</Label>
              <Input
                id="agentId"
                placeholder="Enter agent ID or use URL parameter"
                value={currentAgentId}
                onChange={(e) => setManualAgentId(e.target.value)}
                disabled={isActive}
              />
              {agentIdFromParams && (
                <p className="text-sm text-muted-foreground">
                  Using agent ID from URL: {agentIdFromParams}
                </p>
              )}
            </div>

            {!currentAgentId && (
              <Alert>
                <AlertDescription>
                  Please provide an Agent ID either through the URL parameter (?agent_id=your_id) 
                  or enter it manually above.
                </AlertDescription>
              </Alert>
            )}
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
                  disabled={!currentAgentId || isLoading || isConnecting}
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
                      Start Inference
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
                  Voice inference is active. Speak naturally to interact with the AI.
                </div>
              </div>
            )}
          </CardContent>
        </Card>



        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Information</CardTitle>
            <CardDescription>
              WebSocket connection and audio configuration details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>WebSocket URL:</strong>
                <br />
                <code className="text-xs bg-muted p-1 rounded">
                  {config.getHumeWebSocketUrl(currentAgentId || '{agent_id}')}
                </code>
              </div>
              <div>
                <strong>Audio Configuration:</strong>
                <br />
                <span className="text-muted-foreground">
                  48kHz, Mono, Opus codec
                </span>
              </div>
            </div>
            <Separator />
            <div className="text-muted-foreground">
              <strong>Features:</strong> Real-time speech detection, Audio interruption, 
              High-quality audio playback, Automatic gain control
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Inference;
