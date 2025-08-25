import React from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const Inference = () => {
  const { agentId } = useParams();

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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Voice AI Inference</h1>
          <p className="text-muted-foreground">
            Connect with VoiceCake's voice AI for real-time conversation
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
      </div>
    </div>
  );
};

export default Inference;
