import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Mic, 
  Play, 
  Square, 
  Download, 
  Trash2, 
  Eye,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Volume2
} from "lucide-react";

interface VoiceClone {
  id: string;
  name: string;
  description: string;
  status: "training" | "ready" | "failed";
  audioSample: string;
  createdAt: string;
  trainingProgress: number;
  quality: "high" | "medium" | "low";
  duration: string;
}

const mockVoiceClones: VoiceClone[] = [
  {
    id: "1",
    name: "Professional Male Voice",
    description: "Deep, authoritative voice perfect for business presentations",
    status: "ready",
    audioSample: "professional_male.mp3",
    createdAt: "2024-01-20",
    trainingProgress: 100,
    quality: "high",
    duration: "2m 30s"
  },
  {
    id: "2", 
    name: "Friendly Female Voice",
    description: "Warm, conversational tone ideal for customer service",
    status: "training",
    audioSample: "friendly_female.mp3",
    createdAt: "2024-01-22",
    trainingProgress: 67,
    quality: "medium",
    duration: "1m 45s"
  },
  {
    id: "3",
    name: "Energetic Sales Voice",
    description: "Upbeat and persuasive voice for sales and marketing",
    status: "failed",
    audioSample: "sales_voice.mp3", 
    createdAt: "2024-01-18",
    trainingProgress: 0,
    quality: "low",
    duration: "0m 45s"
  }
];

export default function VoiceClone() {
  const [voiceClones] = useState<VoiceClone[]>(mockVoiceClones);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-green-500";
      case "training": return "bg-blue-500";
      case "failed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready": return CheckCircle;
      case "training": return Clock;
      case "failed": return AlertCircle;
      default: return Clock;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "high": return "text-green-600 bg-green-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // Simulate recording
    setTimeout(() => setIsRecording(false), 5000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadProgress(0);
        }
      }, 200);
    }
  };

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Voice Cloning</h1>
          <p className="text-muted-foreground">Create custom AI voices from audio samples for your agents</p>
        </div>
        <Button 
          size="lg" 
          className="gap-2 btn-theme-gradient border border-theme-primary hover:border-theme-secondary hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create Voice Clone
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload/Record Section */}
        <div className="lg:col-span-1">
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
                    </div>
                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="record" className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto bg-theme-gradient rounded-full flex items-center justify-center">
                      <Mic className={`w-8 h-8 text-white ${isRecording ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <Button
                        size="lg"
                        variant={isRecording ? "destructive" : "default"}
                        className={isRecording ? "" : "btn-theme-gradient"}
                        onClick={isRecording ? () => setIsRecording(false) : handleStartRecording}
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
                      <p className="text-sm text-muted-foreground">
                        Recording... Speak clearly for 30-60 seconds
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Voice Details Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voice-name">Voice Name</Label>
                  <Input id="voice-name" placeholder="e.g., Professional Male Voice" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="voice-description">Description</Label>
                  <Textarea 
                    id="voice-description" 
                    placeholder="Describe the voice characteristics and intended use..."
                    rows={3}
                  />
                </div>

                <Button 
                  className="w-full btn-theme-gradient border border-theme-primary hover:border-theme-secondary"
                  disabled={isUploading || isRecording}
                >
                  Create Voice Clone
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Voice Clones List */}
        <div className="lg:col-span-2">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Your Voice Clones ({voiceClones.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {voiceClones.map((voice, index) => {
                  const StatusIcon = getStatusIcon(voice.status);
                  return (
                    <div 
                      key={voice.id} 
                      className="border rounded-lg p-4 hover:shadow-sm transition-shadow animate-fade-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-foreground">{voice.name}</h3>
                            <Badge className={getStatusColor(voice.status) + " text-white"}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {voice.status}
                            </Badge>
                            <Badge variant="outline" className={getQualityColor(voice.quality)}>
                              {voice.quality} quality
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{voice.description}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Created: {voice.createdAt}</span>
                            <span>Duration: {voice.duration}</span>
                          </div>

                          {voice.status === "training" && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Training Progress</span>
                                <span>{voice.trainingProgress}%</span>
                              </div>
                              <Progress value={voice.trainingProgress} className="h-2" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {voice.status === "ready" && (
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
