import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Play, Edit, MoreVertical, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Agent } from "@/types/agent";

interface AgentCardProps {
  agent: Agent;
  onEdit?: (agent: Agent) => void;
}

export function AgentCard({ agent, onEdit }: AgentCardProps) {
  const navigate = useNavigate();
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 ring-2 ring-primary/20">
              <AvatarImage src={agent.avatar} />
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
          <Button variant="ghost" size="icon-sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="py-4 space-y-4">
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

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{agent.totalSessions} sessions</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{agent.lastUsed}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}`} />
          <span className="text-sm capitalize">{agent.status}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button 
          variant="outline"
          size="sm" 
          className="flex-1 gap-2 btn-theme-gradient border-theme-primary hover:border-theme-secondary"
          onClick={() => navigate(`/agents/${agent.id}/test`)}
        >
          <Play className="w-4 h-4" />
          Test
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 gap-2"
          onClick={() => onEdit?.(agent)}
        >
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}