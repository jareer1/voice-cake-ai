export enum VoiceCloneProvider {
  CARTESIA = "cartesia",
  ELEVENLABS = "elevenlabs", 
  OPENAI = "openai"
}

export enum VoiceCloneLanguage {
  EN = "en", // English
  FR = "fr", // French
  DE = "de", // German
  ES = "es", // Spanish
  PT = "pt", // Portuguese
  ZH = "zh", // Chinese
  JA = "ja", // Japanese
  HI = "hi", // Hindi
  IT = "it", // Italian
  KO = "ko", // Korean
  NL = "nl", // Dutch
  PL = "pl", // Polish
  RU = "ru", // Russian
  SV = "sv", // Swedish
  TR = "tr"  // Turkish
}

export interface VoiceCloneBase {
  name: string;
  description?: string;
  provider?: VoiceCloneProvider;
  language?: VoiceCloneLanguage;
}

// Use VoiceCloneBase directly for creation requests
export type VoiceCloneCreate = VoiceCloneBase;

export interface VoiceCloneResponse extends VoiceCloneBase {
  id: number;
  user_id: number;
  provider_voice_id: string;
  provider?: VoiceCloneProvider;
  language: VoiceCloneLanguage;
  created_at: string;
  updated_at: string;
}

// Legacy interface for existing components (will be updated gradually)
export interface VoiceClone {
  id: string;
  name: string;
  description: string;
  status: "training" | "ready" | "failed";
  audioSample: string;
  createdAt: string;
  trainingProgress: number;
  quality: "high" | "medium" | "low" | "N/A";
  duration: string;
  provider_voice_id: string;
}
