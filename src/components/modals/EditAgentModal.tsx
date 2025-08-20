import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { X, Save, Loader2, MessageSquare, Mic } from "lucide-react";
import { agentAPI } from "@/pages/services/api";
import { toast } from "sonner";
import { Agent } from "@/types/agent";
import { VoiceSelector } from "@/components/ui/voice-selector";

interface EditAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (agentData: any) => void;
  agent: Agent | null;
}

// Voice options are now managed in the centralized voiceConfig.ts file

const modelOptions = [
  { provider: "VOICECAKE", simpleName: "voicecake STS", displayName: "VoiceCake STS" },
  { provider: "OPEN_AI", simpleName: "gpt-5", displayName: "GPT 5" },
  { provider: "OPEN_AI", simpleName: "gpt-5-mini", displayName: "GPT 5 Mini" },
  { provider: "OPEN_AI", simpleName: "gpt-5-nano", displayName: "GPT 5 Nano" },
  { provider: "ANTHROPIC", simpleName: "claude-sonnet-4-20250514", displayName: "Claude Sonnet 4" },
  { provider: "OPEN_AI", simpleName: "gpt-4.1", displayName: "GPT 4.1" },
  { provider: "GOOGLE", simpleName: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash" },
  { provider: "GROQ", simpleName: "kimi-k2-instruct", displayName: "Kimi K2" },
  { provider: "SAMBANOVA", simpleName: "Llama-4-Maverick-17B-128E-Instruct", displayName: "Llama 4 Maverick (17Bx128E)" },
  { provider: "CEREBRAS", simpleName: "qwen-3-235b-a22b-thinking-2507", displayName: "Qwen3 235B Thinking" },
  { provider: "CEREBRAS", simpleName: "qwen-3-235b-a22b-instruct-2507", displayName: "Qwen3 235B Instruct" },
  { provider: "ANTHROPIC", simpleName: "claude-3-7-sonnet-latest", displayName: "Claude 3.7 Sonnet" },
  { provider: "ANTHROPIC", simpleName: "claude-3-5-sonnet-latest", displayName: "Claude 3.5 Sonnet (latest)" },
  { provider: "AMAZON_BEDROCK", simpleName: "claude-3-5-sonnet-20240620-v1", displayName: "Claude 3.5 Sonnet (Amazon Bedrock)" },
  { provider: "OPEN_AI", simpleName: "gpt-4o", displayName: "GPT 4o" },
  { provider: "SAMBANOVA", simpleName: "Qwen3-32B", displayName: "Qwen3 32B" },
  { provider: "SAMBANOVA", simpleName: "DeepSeek-R1-Distill-Llama-70B", displayName: "DeepSeek R1-Distill (Llama 3.3 70B Instruct)" },
  { provider: "CEREBRAS", simpleName: "gpt-oss-120b", displayName: "Cerebras OpenAI GPT OSS" },
  { provider: "ANTHROPIC", simpleName: "claude-3-5-haiku-latest", displayName: "Claude 3.5 Haiku (latest)" },
  { provider: "ANTHROPIC", simpleName: "claude-3-5-sonnet-20240620", displayName: "Claude 3.5 Sonnet (20240620)" },
  { provider: "ANTHROPIC", simpleName: "claude-3-haiku-20240307", displayName: "Claude 3 Haiku (20240307)" },
  { provider: "AMAZON_BEDROCK", simpleName: "claude-3-5-haiku-20241022-v1", displayName: "Claude 3.5 Haiku (Amazon Bedrock Latency Optimized)" },
  { provider: "AMAZON_BEDROCK", simpleName: "claude-3-haiku-20240307-v1", displayName: "Claude 3 Haiku (Amazon Bedrock)" },
  { provider: "GOOGLE", simpleName: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash" },
  { provider: "OPEN_AI", simpleName: "gpt-4-turbo", displayName: "GPT 4 Turbo" },
  { provider: "OPEN_AI", simpleName: "gpt-4o-mini", displayName: "GPT 4o Mini" },
  { provider: "GROQ", simpleName: "llama3-8b-8192", displayName: "Llama 3 8B (8192)" },
  { provider: "GROQ", simpleName: "llama3-70b-8192", displayName: "Llama 3 70B (8192)" },
  { provider: "GROQ", simpleName: "llama-3.3-70b-versatile", displayName: "Llama 3.3 70B (versatile)" },
  { provider: "GROQ", simpleName: "llama-3.1-8b-instant", displayName: "Llama 3.1 8B (instant)" },
  { provider: "FIREWORKS", simpleName: "mixtral-8x7b-instruct", displayName: "Mixtral 8x7B" },
  { provider: "FIREWORKS", simpleName: "llama-v3p1-405b-instruct", displayName: "Llama V3.1 405B" },
  { provider: "FIREWORKS", simpleName: "llama-v3p1-70b-instruct", displayName: "Llama V3.1 70B" },
  { provider: "FIREWORKS", simpleName: "llama-v3p1-8b-instruct", displayName: "Llama V3.1 8B" }
];

// Group models by provider for better organization
const groupedModels = modelOptions.reduce((acc, model) => {
  if (!acc[model.provider]) {
    acc[model.provider] = [];
  }
  acc[model.provider].push(model);
  return acc;
}, {} as Record<string, typeof modelOptions>);

export function EditAgentModal({ isOpen, onClose, onSubmit, agent }: EditAgentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    voice_provider: "",
    voice: "",
    model_provider: "",
    model_resource: "",
    instructions: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgentType, setSelectedAgentType] = useState<'SPEECH' | 'TEXT' | null>(null);

  // Helper function to get agent type display info
  const getAgentTypeInfo = () => {
    if (!agent) return { label: 'Unknown', icon: Mic };
    const agentType = agent.agent_type || agent.type || 'SPEECH';
    if (agentType === 'TEXT') {
      return {
        label: 'Text-To-Speech',
        icon: MessageSquare
      };
    } else {
      return {
        label: 'Speech-To-Speech',
        icon: Mic
      };
    }
  };

  // Populate form when agent data is available
  useEffect(() => {
    if (agent) {
      // Determine voice provider from agent data
      // If the agent uses "hume" as provider, it's actually VoiceCake
      const voiceProvider = agent.voice_provider === "hume" ? "voicecake" : agent.voice_provider || "";
      
      // Set the agent type
      const agentType = agent.agent_type || agent.type || 'SPEECH';
      setSelectedAgentType(agentType as 'SPEECH' | 'TEXT');
      
      setFormData({
        name: agent.name || "",
        description: agent.description || "",
        voice_provider: voiceProvider,
        voice: agent.voice_id || "",
        model_provider: agent.voice_provider || "",
        model_resource: agent.voice_id || "",
        instructions: agent.custom_instructions || ""
      });
    }
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agent) return;
    
    // Validate required fields based on agent type
    if (selectedAgentType === 'SPEECH') {
      if (!formData.name || !formData.description || !formData.voice_provider || !formData.voice || !formData.model_resource) {
        toast.error("Please fill in all required fields for Speech-To-Speech agent");
        return;
      }
    } else {
      if (!formData.name || !formData.description || !formData.voice_provider || !formData.voice || !formData.instructions) {
        toast.error("Please fill in all required fields for Text-To-Speech agent");
        return;
      }
    }

    setIsLoading(true);
    
    try {
      // Map form data to backend expected format
      const agentData = {
        name: formData.name,
        voice_provider: formData.voice_provider === "voicecake" ? "hume" : formData.voice_provider, // VoiceCake masks Hume
        voice_id: formData.voice,
        description: formData.description,
        custom_instructions: formData.instructions,
        model_provider: formData.model_provider,
        model_resource: formData.model_resource,
        agent_type: agent.agent_type || agent.type || 'SPEECH'
      };

      const response = await agentAPI.updateAgent(agent.id.toString(), agentData);
      toast.success("Agent updated successfully!");
      onSubmit(response);
      onClose();
    } catch (error: any) {
      console.error("Error updating agent:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update agent";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Edit Agent</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agent Type Display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedAgentType === 'SPEECH' ? (
                  <Mic className="w-5 h-5 text-primary" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-primary" />
                )}
                <span className="font-semibold">
                  {selectedAgentType === 'SPEECH' ? 'Speech-To-Speech' : 'Text-To-Speech'} Agent
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Cannot be changed
              </Badge>
            </div>

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

            {/* Voice Settings - Always shown */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Voice & Personality</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>TTS Provider</Label>
                  <Select 
                    value={formData.voice_provider} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        voice_provider: value,
                        voice: "" // Reset voice when provider changes
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a TTS provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="voicecake">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          VoiceCake
                        </div>
                      </SelectItem>
                      <SelectItem value="cartesia">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Cartesia
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.voice_provider && (
                  <VoiceSelector
                    value={formData.voice}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, voice: value }))}
                    provider={formData.voice_provider}
                    placeholder="Select a voice"
                  />
                )}
              </div>

              {/* AI Model - Only for Speech-To-Speech */}
              {selectedAgentType === 'SPEECH' && (
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <Select 
                    value={formData.model_resource} 
                    onValueChange={(value) => {
                      const selectedModel = modelOptions.find(model => model.simpleName === value);
                      setFormData(prev => ({ 
                        ...prev, 
                        model_provider: selectedModel?.provider || "",
                        model_resource: value 
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an AI model" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(groupedModels).map(([provider, models]) => (
                        <SelectGroup key={provider}>
                          <SelectLabel>{provider.replace('_', ' ')}</SelectLabel>
                          {models.map((model) => (
                            <SelectItem key={model.simpleName} value={model.simpleName}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                {model.displayName}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Instructions - Always shown when agent type is selected */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Instructions</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="instructions">
                    {selectedAgentType === 'SPEECH' ? 'Custom Instructions' : 'Instructions'}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.instructions.length}/2000 characters
                  </span>
                </div>
                <Textarea
                  id="instructions"
                  placeholder={
                    selectedAgentType === 'SPEECH' 
                      ? `You are a helpful AI assistant. Provide detailed instructions for how you should behave, respond, and interact with users.

Examples:
• Your personality and communication style
• Specific topics you're knowledgeable about
• How to handle different types of questions
• Any specific behaviors or responses to avoid
• Context about your role or purpose

Be as detailed as possible to ensure consistent and helpful responses.`
                      : `Provide detailed instructions for how the agent should respond to text inputs.

Examples:
• Response style and tone
• Specific topics or domains of expertise
• How to handle different types of requests
• Any limitations or guidelines
• Context about the agent's purpose

Be specific to ensure the agent provides helpful and consistent responses.`
                  }
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  rows={8}
                  className="min-h-[200px] resize-y"
                  maxLength={2000}
                  required={selectedAgentType === 'TEXT'}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Tip: The more detailed your instructions, the better the agent will perform. Include personality traits, response style, and specific guidelines.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="outline" 
                className="flex-1 btn-theme-gradient border-theme-primary hover:border-theme-secondary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Agent
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}




