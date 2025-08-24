import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  Mic, 
  Square, 
  Play,
  Pause,
  Download,
  Trash2
} from "lucide-react";
import { VoiceCloneLanguage } from "@/types/voice";
import { useToast } from "@/hooks/use-toast";

// Helper function to format recording time
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Helper function to get language display name
const getLanguageDisplayName = (language: VoiceCloneLanguage): string => {
  const languageNames: Record<VoiceCloneLanguage, string> = {
    [VoiceCloneLanguage.EN]: "English",
    [VoiceCloneLanguage.FR]: "French",
    [VoiceCloneLanguage.DE]: "German", 
    [VoiceCloneLanguage.ES]: "Spanish",
    [VoiceCloneLanguage.PT]: "Portuguese",
    [VoiceCloneLanguage.ZH]: "Chinese",
    [VoiceCloneLanguage.JA]: "Japanese",
    [VoiceCloneLanguage.HI]: "Hindi",
    [VoiceCloneLanguage.IT]: "Italian",
    [VoiceCloneLanguage.KO]: "Korean",
    [VoiceCloneLanguage.NL]: "Dutch",
    [VoiceCloneLanguage.PL]: "Polish",
    [VoiceCloneLanguage.RU]: "Russian",
    [VoiceCloneLanguage.SV]: "Swedish",
    [VoiceCloneLanguage.TR]: "Turkish"
  };
  return languageNames[language];
};

interface VoiceRecorderProps {
  onVoiceCloneCreate: (data: {
    name: string;
    description: string;
    language: VoiceCloneLanguage;
    audioFile: File;
  }) => Promise<void>;
  isCreating?: boolean;
}

export default function VoiceRecorder({ onVoiceCloneCreate, isCreating = false }: VoiceRecorderProps) {
  const [voiceName, setVoiceName] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceCloneLanguage>(VoiceCloneLanguage.EN);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Recording timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      // Start timer immediately when recording starts
      setRecordingTime(0);
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        URL.revokeObjectURL(audioElement.src);
      }
    };
  }, [audioElement]);

  const handleStartRecording = async () => {
    try {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
        setIsPlaying(false);
        setAudioElement(null);
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1, // Mono for voice recording
        } 
      });
      
      // Choose the best available format for recording
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
      }
      
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000, // Good quality for voice
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstart = () => {
        // Set recording state only when recording actually starts
        setIsRecording(true);
        console.log('🎤 Recording started');
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { 
          type: recorder.mimeType || 'audio/webm' 
        });
        
        // Convert blob to file
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
          type: audioBlob.type,
          lastModified: Date.now()
        });
        
        setSelectedAudioFile(audioFile);
        setAudioChunks([]);
        setIsRecording(false);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        toast({
          title: "Recording Complete",
          description: `Recorded: ${audioFile.name}`,
        });
        
        console.log('🎤 Recording stopped');
      };
      
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      
      // Start recording immediately without time slicing to capture all audio
      recorder.start();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setMediaRecorder(null);
      // Note: setIsRecording(false) is handled in the onstop event
    }
  };

  const handlePlayAudio = () => {
    if (!selectedAudioFile) return;

    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }

    const audio = new Audio();
    const audioUrl = URL.createObjectURL(selectedAudioFile);
    audio.src = audioUrl;
    
    // Preload the audio to reduce timing delays
    audio.preload = 'auto';
    
    audio.onloadeddata = () => {
      console.log('🎵 Audio loaded and ready to play');
    };
    
    audio.onended = () => {
      setIsPlaying(false);
      setAudioElement(null);
      URL.revokeObjectURL(audioUrl);
      console.log('🎵 Audio playback ended');
    };
    
    audio.onerror = (error) => {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
      setAudioElement(null);
      URL.revokeObjectURL(audioUrl);
      toast({
        title: "Error",
        description: "Could not play audio file.",
        variant: "destructive",
      });
    };

    // Set the audio element immediately to prevent race conditions
    setAudioElement(audio);

    // Play the audio with better error handling
    audio.play().then(() => {
      setIsPlaying(true);
      console.log('🎵 Audio playback started');
    }).catch((error) => {
      console.error('Error starting audio playback:', error);
      setIsPlaying(false);
      setAudioElement(null);
      URL.revokeObjectURL(audioUrl);
      toast({
        title: "Error",
        description: "Could not play audio file.",
        variant: "destructive",
      });
    });
  };

  const handleDownloadAudio = () => {
    if (!selectedAudioFile) return;

    const url = URL.createObjectURL(selectedAudioFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedAudioFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Audio file download has started.",
    });
  };

  const handleDiscardAudio = () => {
    // Stop any currently playing audio
    if (audioElement) {
      audioElement.pause();
      URL.revokeObjectURL(audioElement.src);
      setAudioElement(null);
    }
    
    setIsPlaying(false);
    setSelectedAudioFile(null);
    
    // Reset file input
    const fileInput = document.getElementById('audio-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    toast({
      title: "Audio Discarded",
      description: "Audio file has been removed. You can select or record a new one.",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
        setIsPlaying(false);
        setAudioElement(null);
      }
      
      setSelectedAudioFile(file);
      toast({
        title: "File Selected",
        description: `Selected: ${file.name}`,
      });
    }
  };

  const handleCreateVoiceClone = async () => {
    if (!voiceName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a voice name.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedAudioFile) {
      toast({
        title: "Error",
        description: "Please select an audio file.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onVoiceCloneCreate({
        name: voiceName,
        description: voiceDescription,
        language: voiceLanguage,
        audioFile: selectedAudioFile
      });
      
      // Reset form after successful creation
      setVoiceName("");
      setVoiceDescription("");
      setVoiceLanguage(VoiceCloneLanguage.EN);
      setSelectedAudioFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('audio-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error in voice recorder:', error);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Create New Voice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Audio</TabsTrigger>
            <TabsTrigger value="record">Record Voice</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="audio-upload">Audio File</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drop your audio file here or click to browse
                </p>
                <Input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('audio-upload')?.click()}
                >
                  Choose File
                </Button>
                {selectedAudioFile && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-green-600">
                      Selected: {selectedAudioFile.name}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePlayAudio}
                        className="gap-2"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-4 h-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Play
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadAudio}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDiscardAudio}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Discard
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="record" className="space-y-4">
            <div className="text-center space-y-4">
              <div className={`w-24 h-24 mx-auto bg-theme-gradient rounded-full flex items-center justify-center relative transition-all duration-500 ${
                isRecording ? 'scale-110 shadow-lg shadow-red-500/50' : 'scale-100'
              }`} style={{ 
                animation: isRecording ? 'pulse 3s ease-in-out infinite' : 'none' 
              }}>
                {/* Pulsing rings when recording */}
                {isRecording && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-red-400 opacity-20" style={{ 
                      animation: 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite' 
                    }}></div>
                    <div className="absolute inset-2 rounded-full bg-red-300 opacity-30" style={{ 
                      animation: 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                      animationDelay: '0.8s' 
                    }}></div>
                    <div className="absolute inset-4 rounded-full bg-red-200 opacity-40" style={{ 
                      animation: 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                      animationDelay: '1.6s' 
                    }}></div>
                  </>
                )}
                <Mic className={`w-8 h-8 text-white relative z-10`} style={{
                  animation: isRecording ? 'bounce 2s ease-in-out infinite' : 'none'
                }} />
              </div>
              <div>
                <Button
                  size="lg"
                  variant={isRecording ? "destructive" : "default"}
                  className={isRecording ? "" : "btn-theme-gradient"}
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>
              </div>
              {isRecording && (
                <div className="text-center animate-fade-in">
                  <p className="text-sm text-muted-foreground mb-2" style={{
                    animation: 'pulse 2.5s ease-in-out infinite'
                  }}>
                    🔴 Recording... Speak clearly for about 5-7 seconds
                  </p>
                  <p className="text-lg font-mono text-red-600" style={{
                    animation: 'pulse 2.5s ease-in-out infinite',
                    animationDelay: '0.5s'
                  }}>
                    {formatTime(recordingTime)}
                  </p>
                </div>
              )}
              
              {selectedAudioFile && !isRecording && (
                <div className="space-y-3">
                  <p className="text-sm text-green-600">
                    Recorded: {selectedAudioFile.name}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePlayAudio}
                      className="gap-2"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Play
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadAudio}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDiscardAudio}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Discard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Voice Details Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voice-name">Voice Name</Label>
            <Input 
              id="voice-name" 
              placeholder="e.g., Professional Male Voice"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="voice-description">Description</Label>
            <Textarea 
              id="voice-description" 
              placeholder="Describe the voice characteristics and intended use..."
              rows={3}
              value={voiceDescription}
              onChange={(e) => setVoiceDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice-language">Language</Label>
            <Select
              value={voiceLanguage}
              onValueChange={(value) => setVoiceLanguage(value as VoiceCloneLanguage)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(VoiceCloneLanguage).map((language) => (
                  <SelectItem key={language} value={language}>
                    {getLanguageDisplayName(language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="w-full btn-theme-gradient border border-theme-primary hover:border-theme-secondary"
            disabled={isCreating || isRecording || !voiceName.trim() || !selectedAudioFile}
            onClick={handleCreateVoiceClone}
          >
            {isCreating ? "Creating..." : "Create Voice Clone"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
