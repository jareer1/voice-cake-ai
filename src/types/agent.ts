export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'training';
  voice: {
    provider: 'elevenlabs' | 'openai' | 'custom';
    voiceId: string;
    settings: {
      speed?: number;
      pitch?: number;
      stability?: number;
    };
  };
  tools: string[];
  personality: {
    tone: string;
    style: string;
    instructions: string;
  };
  integrations: {
    whatsapp?: boolean;
    voice_calls?: boolean;
    web?: boolean;
  };
  analytics: {
    totalSessions: number;
    avgSessionLength: number;
    satisfactionScore: number;
  };
  totalSessions: number;
  lastUsed: string;
  createdAt: string;
  updatedAt: string;
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