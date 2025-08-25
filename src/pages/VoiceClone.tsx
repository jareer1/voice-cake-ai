import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus,
  Volume2
} from "lucide-react";
import VoiceCloneItem from "@/components/VoiceCloneItem";
import VoiceRecorder from "@/components/VoiceRecorder";
import type { VoiceClone, VoiceCloneResponse, VoiceCloneCreate } from "@/types/voice";
import { VoiceCloneLanguage } from "@/types/voice";
import { voiceCloneAPI } from "@/pages/services/api";
import { useToast } from "@/hooks/use-toast";

// Helper function to convert API response to legacy format for existing components
const convertToLegacyFormat = (apiResponse: VoiceCloneResponse): VoiceClone => ({
  id: apiResponse.id.toString(),
  name: apiResponse.name,
  description: apiResponse.description || "",
  status: "ready", // Default to ready for now, can be enhanced later
  audioSample: "", // Not provided by API
  createdAt: new Date(apiResponse.created_at).toLocaleDateString(),
  trainingProgress: 100, // Default to complete
  quality: "N/A", // Default quality
  duration: "N/A", // Not provided by API
  provider_voice_id: apiResponse.provider_voice_id
});

export default function VoiceClone() {
  const [voiceClones, setVoiceClones] = useState<VoiceClone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Fetch voice clones on component mount
  useEffect(() => {
    fetchVoiceClones();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchVoiceClones = async () => {
    try {
      setIsLoading(true);
      const response = await voiceCloneAPI.getVoiceClones();
      const convertedClones = response.map(convertToLegacyFormat);
      setVoiceClones(convertedClones);
    } catch (error) {
      console.error('Error fetching voice clones:', error);
      toast({
        title: "Error",
        description: "Failed to fetch voice clones. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceCloneCreate = async (data: {
    name: string;
    description: string;
    language: VoiceCloneLanguage;
    audioFile: File;
  }) => {
    setIsCreating(true);
    try {
      const voiceCloneData: VoiceCloneCreate = {
        name: data.name,
        description: data.description || undefined,
        language: data.language
      };

      const response = await voiceCloneAPI.createVoiceCloneWithAudio(voiceCloneData, data.audioFile);
      const newClone = convertToLegacyFormat(response);
      setVoiceClones(prev => [...prev, newClone]);
      
      toast({
        title: "Success",
        description: "Voice clone created successfully!",
      });
    } catch (error) {
      console.error('Error creating voice clone:', error);
      toast({
        title: "Error",
        description: "Failed to create voice clone. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw so VoiceRecorder knows there was an error
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteVoiceClone = (id: string) => {
    setVoiceClones(prev => prev.filter(clone => clone.id !== id));
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
          <VoiceRecorder 
            onVoiceCloneCreate={handleVoiceCloneCreate}
            isCreating={isCreating}
          />
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
                 {isLoading ? (
                   <div className="text-center text-muted-foreground py-8">
                     Loading voice clones...
                          </div>
                 ) : voiceClones.length === 0 ? (
                   <div className="text-center text-muted-foreground py-8">
                     No voice clones found. Create your first voice clone to get started!
                          </div>
                 ) : (
                   voiceClones.map((voice, index) => (
                     <VoiceCloneItem
                       key={voice.id}
                       voice={voice}
                       index={index}
                       onDelete={handleDeleteVoiceClone}
                     />
                   ))
                 )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
