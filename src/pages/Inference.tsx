import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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
  Download,
  Trash2,
  MessageSquare,
  Volume1,
  Volume
} from "lucide-react";
import useHumeInference, { INFERENCE_STATES } from "@/hooks/useHumeInference";
import { toast } from "sonner";

const Inference = () => {
  const { agentId } = useParams();

  // Background audio state
  const [backgroundAudioEnabled, setBackgroundAudioEnabled] = useState(false);
  const [backgroundVolume, setBackgroundVolume] = useState(0.3); // Default 30% volume
  const [isBackgroundAudioPlaying, setIsBackgroundAudioPlaying] = useState(false);
  const [selectedAudioFile, setSelectedAudioFile] = useState('background-chatter.mp3');
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  const {
    inferenceState,
    isLoading,
    isMicOn,
    isConnected,
    isUserSpeaking,
    startInference,
    stopInference,
    toggleMic,
    transcription,
    isTranscribing,
    saveTranscription,
    clearTranscription,
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

  const handleSaveTranscription = () => {
    saveTranscription();
  };

  const handleClearTranscription = () => {
    clearTranscription();
    toast.success("Transcription cleared");
  };

  // Clean transcription text for display (remove error indicators)
  const cleanTranscriptionText = (text: string) => {
    return text
      .replace(/\s*\[partial due to error\]\s*/gi, '')
      .replace(/\s*\[interrupted\]\s*/gi, '')
      .replace(/\s*\[AI Response\]\s*/gi, '')
      .trim();
  };

  // Check if transcription has meaningful content
  const hasMeaningfulTranscription = () => {
    return transcription && transcription.length > 0 && 
           transcription.some(entry => cleanTranscriptionText(entry.text).length > 0);
  };

  // Background audio functions
  const initializeBackgroundAudio = () => {
    if (!backgroundAudioRef.current) {
      // Use a direct path to the audio file
      backgroundAudioRef.current = new Audio(`/${selectedAudioFile}`);
      backgroundAudioRef.current.loop = true;
      backgroundAudioRef.current.volume = backgroundVolume;
      
      backgroundAudioRef.current.addEventListener('play', () => {
        setIsBackgroundAudioPlaying(true);
      });
      
      backgroundAudioRef.current.addEventListener('pause', () => {
        setIsBackgroundAudioPlaying(false);
      });
      
      backgroundAudioRef.current.addEventListener('ended', () => {
        setIsBackgroundAudioPlaying(false);
      });
    }
  };

  const toggleBackgroundAudio = () => {
    if (!backgroundAudioRef.current) {
      initializeBackgroundAudio();
    }
    
    if (backgroundAudioRef.current) {
      if (isBackgroundAudioPlaying) {
        backgroundAudioRef.current.pause();
        setIsBackgroundAudioPlaying(false);
      } else {
        backgroundAudioRef.current.play().catch(error => {
          console.error('Error playing background audio:', error);
          toast.error('Failed to play background audio');
        });
      }
    }
  };

  const handleBackgroundVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setBackgroundVolume(newVolume);
    
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = newVolume;
    }
  };

  const stopBackgroundAudio = () => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current.currentTime = 0;
      setIsBackgroundAudioPlaying(false);
    }
  };

  const changeAudioFile = (newAudioFile: string) => {
    setSelectedAudioFile(newAudioFile);
    
    // If audio is currently playing, restart with new file
    if (isBackgroundAudioPlaying && backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current = null;
      initializeBackgroundAudio();
      backgroundAudioRef.current?.play().catch(error => {
        console.error('Error playing new background audio:', error);
      });
    }
  };

  // Start background audio when inference starts
  useEffect(() => {
    if (inferenceState === "ACTIVE" && backgroundAudioEnabled && !isBackgroundAudioPlaying) {
      // Small delay to ensure inference is fully started
      const timer = setTimeout(() => {
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.play().catch(error => {
            console.error('Error playing background audio on inference start:', error);
          });
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [inferenceState, backgroundAudioEnabled, isBackgroundAudioPlaying]);

  // Stop background audio when inference stops
  useEffect(() => {
    if (inferenceState === "IDLE" && isBackgroundAudioPlaying) {
      stopBackgroundAudio();
    }
  }, [inferenceState, isBackgroundAudioPlaying]);

  // Cleanup background audio on unmount
  useEffect(() => {
    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
    };
  }, []);

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



        {/* Background Audio Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume className="h-5 w-5" />
              Background Audio
            </CardTitle>
            <CardDescription>
              Add ambient background sound to enhance the conversation experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleBackgroundAudio}
                  variant={backgroundAudioEnabled ? "default" : "outline"}
                  size="sm"
                  disabled={!isActive}
                >
                  {isBackgroundAudioPlaying ? (
                    <>
                      <VolumeX className="mr-2 h-4 w-4" />
                      Stop Audio
                    </>
                  ) : (
                    <>
                      <Volume1 className="mr-2 h-4 w-4" />
                      Start Audio
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="backgroundAudioEnabled"
                    checked={backgroundAudioEnabled}
                    onChange={(e) => setBackgroundAudioEnabled(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="backgroundAudioEnabled" className="text-sm">
                    Auto-play when inference starts
                  </label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Background Audio File</label>
              <div className="flex gap-2">
                <Button
                  variant={selectedAudioFile === 'background-chatter.mp3' ? "default" : "outline"}
                  size="sm"
                  onClick={() => changeAudioFile('background-chatter.mp3')}
                  disabled={!backgroundAudioEnabled}
                >
                  Chatter 1
                </Button>
                <Button
                  variant={selectedAudioFile === 'background-chatter-2.mp3' ? "default" : "outline"}
                  size="sm"
                  onClick={() => changeAudioFile('background-chatter-2.mp3')}
                  disabled={!backgroundAudioEnabled}
                >
                  Chatter 2
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Volume</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(backgroundVolume * 100)}%
                </span>
              </div>
              <Slider
                value={[backgroundVolume * 100]}
                onValueChange={handleBackgroundVolumeChange}
                max={100}
                min={0}
                step={5}
                className="w-full"
                disabled={!backgroundAudioEnabled}
              />
            </div>
            
            {backgroundAudioEnabled && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Background audio will play automatically when inference starts
                </div>
              </div>
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

        {/* Transcription Display - Only show when inference is active or has content */}
        {(isActive || hasMeaningfulTranscription()) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation History
              </CardTitle>
              <CardDescription>
                View and manage the conversation history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Transcription</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveTranscription}
                      disabled={!hasMeaningfulTranscription() || isTranscribing}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      onClick={handleClearTranscription}
                      disabled={!hasMeaningfulTranscription() || isTranscribing}
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </div>
                
                {isTranscribing ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-lg">Transcribing...</span>
                  </div>
                ) : hasMeaningfulTranscription() ? (
                  <div className="overflow-y-auto max-h-60 p-4 bg-gray-50 rounded-md">
                    {transcription
                      .filter(entry => cleanTranscriptionText(entry.text).length > 0)
                      .map((entry, index) => {
                        const cleanText = cleanTranscriptionText(entry.text);
                        if (!cleanText) return null;
                        
                        return (
                          <div key={entry.id} className={`mb-4 p-3 rounded-lg ${
                            entry.speaker === 'user' ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-green-50 border-l-4 border-green-400'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-sm font-medium ${
                                entry.speaker === 'user' ? 'text-blue-700' : 'text-green-700'
                              }`}>
                                {entry.speaker === 'user' ? '👤 You' : '🤖 AI'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {entry.timestamp.toLocaleTimeString()}
                                {entry.duration && ` (${entry.duration.toFixed(1)}s)`}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800">{cleanText}</p>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    {isActive ? (
                      <div className="space-y-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mx-auto"></div>
                        <p className="text-sm text-muted-foreground">
                          Start speaking to see transcription here
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No conversation history available
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}


        </div>
      </div>
    );
  };

export default Inference;
