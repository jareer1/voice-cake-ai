export type AgentType = 'SPEECH' | 'TEXT';

export interface Agent {
  voice_provider: string;
  voice_id: string;
  custom_instructions: string;
  id: number;
  name: string;
  description: string;
  avatar_url?: string | null;
  status: 'active' | 'inactive' | 'training';
  total_sessions: number;
  last_used: string | null;
  created_at: string;
  model_provider?: string;
  type?: AgentType;
  agent_type?: AgentType;
  tool_ids?: string[];
  
  // Optional fields for extended agent data (if needed)
  voice?: {
    provider: 'elevenlabs' | 'openai' | 'custom' | 'hume' | 'voicecake' | 'cartesia';
    voiceId: string;
    settings: {
      speed?: number;
      pitch?: number;
      stability?: number;
    };
  };
  tools?: string[];
  personality?: {
    tone: string;
    style: string;
    instructions: string;
  };
  integrations?: {
    whatsapp?: boolean;
    voice_calls?: boolean;
    web?: boolean;
  };
  analytics?: {
    totalSessions: number;
    avgSessionLength: number;
    satisfactionScore: number;
  };
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  type: 'api_call' | 'database' | 'integration' | 'custom';
  parameters: Record<string, any>;
  enabled: boolean;
  createdAt: string;
}

export interface VoiceClone {
  id: string;
  name: string;
  provider: string;
  voiceId: string;
  status: 'processing' | 'ready' | 'failed';
  audioSamples: string[];
  createdAt: string;
}