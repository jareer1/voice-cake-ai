import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Plus, Mic, MessageSquare, Phone, Globe } from "lucide-react";

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (agentData: any) => void;
}

const availableTools = [
  "Knowledge Base",
  "Calendar Integration", 
  "CRM System",
  "Ticket Management",
  "Product Catalog",
  "Payment Processing",
  "Email System",
  "Document Manager"
];

const voiceOptions = [
  { id: "voice_1", name: "Sarah - Professional", provider: "elevenlabs" },
  { id: "voice_2", name: "Michael - Friendly", provider: "elevenlabs" },
  { id: "voice_3", name: "Emma - Energetic", provider: "elevenlabs" },
  { id: "voice_4", name: "Custom Clone", provider: "custom" }
];

export function CreateAgentModal({ isOpen, onClose, onSubmit }: CreateAgentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    voice: "",
    tone: "professional",
    instructions: "",
    tools: [] as string[],
    integrations: {
      whatsapp: false,
      voice_calls: true,
      web: true
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const toggleTool = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool]
    }));
  };

  const updateIntegration = (integration: keyof typeof formData.integrations, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        [integration]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Create New Agent</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Customer Support AI"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this agent does and how it helps users..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* Voice Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Voice & Personality</h3>
              
              <div className="space-y-2">
                <Label>Voice</Label>
                <Select value={formData.voice} onValueChange={(value) => setFormData(prev => ({ ...prev, voice: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceOptions.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4" />
                          {voice.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={formData.tone} onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="empathetic">Empathetic</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Custom Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Provide specific instructions for how the agent should behave and respond..."
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            {/* Tools */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Tools & Capabilities</h3>
              <p className="text-sm text-muted-foreground">
                Select the tools your agent can use to help users
              </p>
              
              <div className="flex flex-wrap gap-2">
                {availableTools.map((tool) => (
                  <Badge
                    key={tool}
                    variant="outline"
                    className={`cursor-pointer transition-all duration-300 ${
                      formData.tools.includes(tool)
                        ? "btn-theme-gradient border-theme-primary hover:border-theme-secondary"
                        : "hover:btn-theme-gradient hover:border-theme-primary"
                    }`}
                    onClick={() => toggleTool(tool)}
                  >
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Integrations */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Channel Integrations</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-success" />
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">Enable WhatsApp messaging</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.integrations.whatsapp}
                    onCheckedChange={(checked) => updateIntegration('whatsapp', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Voice Calls</p>
                      <p className="text-sm text-muted-foreground">Enable phone call support</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.integrations.voice_calls}
                    onCheckedChange={(checked) => updateIntegration('voice_calls', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-accent" />
                    <div>
                      <p className="font-medium">Web Widget</p>
                      <p className="text-sm text-muted-foreground">Embed on website</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.integrations.web}
                    onCheckedChange={(checked) => updateIntegration('web', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="outline" className="flex-1 btn-theme-gradient border-theme-primary hover:border-theme-secondary">
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}