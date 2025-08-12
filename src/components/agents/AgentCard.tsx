import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Bot, Play, Edit, MoreVertical, Users, Clock, Trash2, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Agent } from "@/types/agent";
import { toast } from "sonner";

interface AgentCardProps {
  agent: Agent;
  onEdit?: (agent: Agent) => void;
  onDelete?: (agent: Agent) => void;
}

export function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  const navigate = useNavigate();

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/${agent.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Chat with ${agent.name}`,
          text: `Try out ${agent.name} - an AI voice agent: ${agent.description}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied to clipboard!");
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied to clipboard!");
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
        toast.error("Failed to copy share link");
      }
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/share/${agent.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error("Failed to copy share link");
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 ring-2 ring-primary/20">
              <AvatarImage src={agent.avatar_url || undefined} />
              <AvatarFallback className="avatar-theme-gradient text-white font-semibold">
                {agent.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                {agent.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {agent.description}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(agent)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Agent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Agent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(agent)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Agent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="py-4 space-y-4">
        {agent.tools && agent.tools.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {agent.tools.slice(0, 3).map((tool) => (
              <Badge key={tool} variant="secondary" className="text-xs">
                {tool}
              </Badge>
            ))}
            {agent.tools.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{agent.tools.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{agent.total_sessions} sessions</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{agent.last_used ? new Date(agent.last_used).toLocaleDateString() : 'Never'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}`} />
            <span className="text-sm capitalize">{agent.status}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            <Share2 className="w-3 h-3 mr-1" />
            Shareable
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button 
          variant="outline"
          size="sm" 
          className="flex-1 gap-2 btn-theme-gradient border-theme-primary hover:border-theme-secondary"
          onClick={() => navigate(`/inference/${agent.id}`)}
        >
          <Play className="w-4 h-4" />
          Test
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 gap-2"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
}