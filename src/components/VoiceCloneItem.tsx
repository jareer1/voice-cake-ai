import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Eye, 
  Download, 
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { VoiceClone } from "@/types/voice";
import { voiceCloneAPI } from "@/pages/services/api";
import { useToast } from "@/hooks/use-toast";

interface VoiceCloneItemProps {
  voice: VoiceClone;
  index: number;
  onDelete?: (id: string) => void;
}

export default function VoiceCloneItem({ 
  voice, 
  index,
  onDelete
}: VoiceCloneItemProps) {
  const { toast } = useToast();
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

  const handlePlay = () => {
    console.log('Play voice clone:', voice.id);
    // TODO: Implement play functionality
  };

  const handleView = () => {
    console.log('View voice clone:', voice.id);
    // TODO: Implement view functionality
  };

  const handleDownload = () => {
    console.log('Download voice clone:', voice.id);
    // TODO: Implement download functionality
  };

  const handleDelete = async () => {
    try {
      await voiceCloneAPI.deleteVoiceClone(voice.provider_voice_id);
      onDelete?.(voice.id);
      toast({
        title: "Success",
        description: "Voice clone deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting voice clone:', error);
      toast({
        title: "Error",
        description: "Failed to delete voice clone. Please try again.",
        variant: "destructive",
      });
    }
  };

  const StatusIcon = getStatusIcon(voice.status);

  return (
    <div 
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePlay}
          >
            <Play className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleView}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {voice.status === "ready" && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
