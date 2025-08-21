import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Copy, ExternalLink, Share2, MessageCircle, Twitter, Facebook, Linkedin, Mail } from "lucide-react";
import { Agent } from "@/types/agent";
import { toast } from "sonner";

interface ShareAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
}

export function ShareAgentModal({ isOpen, onClose, agent }: ShareAgentModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !agent) return null;

  const shareUrl = `${window.location.origin}/share/${agent.id}`;
  const shareText = `Try out ${agent.name} - an AI voice agent: ${agent.description}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    
    let shareLink = "";
    
    switch (platform) {
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "email":
        shareLink = `mailto:?subject=Check out this AI agent: ${agent.name}&body=${encodedText}%0A%0A${encodedUrl}`;
        break;
      default:
        return;
    }
    
    window.open(shareLink, "_blank", "width=600,height=400");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Chat with ${agent.name}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Share Agent</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Agent Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-white font-semibold">
                  {agent.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Share Link */}
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="flex-1"
                />
                <Button 
                  onClick={handleCopyLink}
                  variant="outline"
                  size="icon"
                  className={copied ? "bg-green-50 border-green-200" : ""}
                >
                  <Copy className={`w-4 h-4 ${copied ? "text-green-600" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Social Media Buttons */}
            <div className="space-y-3">
              <Label>Share on</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => handleShare("whatsapp")}
                  variant="outline"
                  className="flex items-center gap-2 bg-green-50 border-green-200 hover:bg-green-100"
                >
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  WhatsApp
                </Button>
                
                <Button 
                  onClick={() => handleShare("twitter")}
                  variant="outline"
                  className="flex items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
                >
                  <Twitter className="w-4 h-4 text-blue-600" />
                  Twitter
                </Button>
                
                <Button 
                  onClick={() => handleShare("facebook")}
                  variant="outline"
                  className="flex items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
                >
                  <Facebook className="w-4 h-4 text-blue-600" />
                  Facebook
                </Button>
                
                <Button 
                  onClick={() => handleShare("linkedin")}
                  variant="outline"
                  className="flex items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
                >
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  LinkedIn
                </Button>
                
                <Button 
                  onClick={() => handleShare("email")}
                  variant="outline"
                  className="flex items-center gap-2 bg-gray-50 border-gray-200 hover:bg-gray-100"
                >
                  <Mail className="w-4 h-4 text-gray-600" />
                  Email
                </Button>
                
                <Button 
                  onClick={handleNativeShare}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  More Options
                </Button>
              </div>
            </div>

            {/* Preview Link */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Preview</Label>
                <Badge variant="secondary" className="text-xs">Public URL</Badge>
              </div>
              <Button 
                onClick={() => window.open(shareUrl, "_blank")}
                variant="outline"
                className="w-full justify-start"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open shared agent page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
