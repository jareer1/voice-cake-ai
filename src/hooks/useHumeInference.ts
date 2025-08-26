import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import config from "@/lib/config";
import { agentAPI, liveKitAPI } from "@/pages/services/api";
import { publicAgentAPI } from "@/pages/services/publicApi";
import { Room, RoomEvent, Track, TranscriptionSegment } from 'livekit-client';

export const INFERENCE_STATES = {
  IDLE: "idle",
  CONNECTING: "connecting",
  ACTIVE: "active",
  ERROR: "error",
} as const;

interface UseHumeInferenceProps {
  agentId?: string;
  onAudioReceived?: (audioBlob: Blob) => void;
  agentData?: any; // Optional pre-fetched agent data for public inference
}

// Transcription entry interface
interface TranscriptionEntry {
  id: string;
  timestamp: Date;
  speaker: 'user' | 'ai';
  text: string;
  duration?: number; // Duration in seconds for AI responses
  confidence?: number; // Confidence score for transcription
  isFinal?: boolean; // Whether this is a final transcription
  source?: 'livekit' | 'webspeech'; // Source of transcription
  participantId?: string; // LiveKit participant ID
  trackId?: string; // LiveKit track ID
}

const useHumeInference = ({ 
  agentId, 
  onAudioReceived,
  agentData
}: UseHumeInferenceProps = {}) => {
  const [inferenceState, setInferenceState] = useState<keyof typeof INFERENCE_STATES>("IDLE");
  const [isLoading, setIsLoading] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [agentDetails, setAgentDetails] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  
  // Transcription state
  const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionUpdateTrigger, setTranscriptionUpdateTrigger] = useState(0);
  
  // WebSocket and Media Stream refs (for SPEECH agents)
  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // LiveKit room ref (for TEXT agents)
  const roomRef = useRef<Room | null>(null);
  
  // Audio Management
  const audioQueueRef = useRef<{ type: string; blob: Blob; mimeType: string }[]>([]);
  const isPlayingRef = useRef(false);
  const shouldInterruptRef = useRef(false);
  
  // Real-time audio streaming for small chunks
  const audioStreamQueue = useRef<{ blob: Blob; mimeType: string }[]>([]);
  const isStreamingRef = useRef(false);
  const nextPlayTimeRef = useRef(0); // Precise timing for seamless transitions
  const lastChunkEndTimeRef = useRef(0); // Track actual chunk end times
  
  // Audio Context for high-quality playback
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // Speech Detection
  const isUserSpeakingRef = useRef(false);
  const speechContextRef = useRef<AudioContext | null>(null);
  const speechFramesRef = useRef(0);
  const silenceFramesRef = useRef(0);

  // Transcription tracking
  const currentUserSpeechRef = useRef<string>('');
  const currentAISpeechRef = useRef<string>('');
  const speechStartTimeRef = useRef<number>(0);
  const aiResponseStartTimeRef = useRef<number>(0);
  const isUserSpeakingForTranscriptionRef = useRef(false);
  const isAISpeakingForTranscriptionRef = useRef(false);
  const userTranscriptionAddedRef = useRef(false); // Flag to prevent duplicate user transcriptions
  const aiTranscriptionAddedRef = useRef(false); // Flag to prevent duplicate AI transcriptions
  
  // LiveKit transcription state tracking
  const isLiveKitTranscriptionActive = useRef(false);

  // Initialize high-quality audio context with browser-optimized settings for maximum audio fidelity
  const initializeAudioContext = useCallback(async () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      // Use maximum sample rate and quality settings
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 48000, // High sample rate for crisp audio
      });
      
      // Create gain node with high precision
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = 1.0; // No volume reduction
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  // Clean transcription text (remove error indicators and normalize)
  const cleanTranscriptionText = useCallback((text: string): string => {
    return text
      .replace(/\s*\[partial due to error\]\s*/gi, '')
      .replace(/\s*\[interrupted\]\s*/gi, '')
      .replace(/\s*\[AI Response\]\s*/gi, '')
      .trim();
  }, []);

  // Enhanced transcription methods for LiveKit integration
  const addTranscriptionEntry = useCallback((speaker: 'user' | 'ai', text: string, duration?: number, confidence?: number, isFinal: boolean = true, source: 'livekit' | 'webspeech' = 'webspeech', participantId?: string, trackId?: string) => {
    // Clean the text before adding to transcription
    const cleanText = cleanTranscriptionText(text);
    
    // Only add if there's meaningful content
    if (!cleanText) {
      console.log(`📝 Skipping empty transcription for ${speaker}`);
      return;
    }
    
    // Only add final transcriptions to avoid interim duplicates
    if (!isFinal) {
      console.log(`📝 Skipping interim transcription for ${speaker}: "${cleanText}"`);
      return;
    }
    
    // Map speaker labels for display
    const displaySpeaker = speaker === 'ai' ? 'Web Agent' : 'User';
    
    const entry: TranscriptionEntry = {
      id: `${speaker}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      speaker,
      text: cleanText, // Store clean text
      duration,
      confidence,
      isFinal,
      source,
      participantId,
      trackId
    };
    
    setTranscription(prev => {
      const newTranscription = [...prev, entry];
      // Force immediate re-render
      setTranscriptionUpdateTrigger(t => t + 1);
      return newTranscription;
    });
    
    console.log(`📝 ${source.toUpperCase()} FINAL transcription added: ${displaySpeaker} - "${cleanText}" (confidence: ${confidence ? (confidence * 100).toFixed(1) + '%' : 'N/A'}, participant: ${participantId || 'N/A'})`);
  }, [cleanTranscriptionText]);

  // Immediate interruption for real-time response
  const executeImmediateInterruption = useCallback(() => {
    console.log('🚨 IMMEDIATE INTERRUPTION - stopping all audio NOW');
    
    shouldInterruptRef.current = true;
  
    // Save AI transcription before stopping recognition
    if (currentAISpeechRef.current.trim()) {
      console.log('💾 Saving AI transcription before interruption:', currentAISpeechRef.current.trim());
      const duration = (Date.now() - aiResponseStartTimeRef.current) / 1000;
      addTranscriptionEntry('ai', currentAISpeechRef.current.trim(), duration, undefined, true, 'livekit');
      currentAISpeechRef.current = '';
    }
    
    // Reset AI transcription state
    isAISpeakingForTranscriptionRef.current = false;
    
    // Clear stream queue and reset timing
    audioStreamQueue.current = [];
    nextPlayTimeRef.current = 0;
    
    // Stop current AudioContext source immediately
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop(0);
        currentAudioSourceRef.current.disconnect();
        currentAudioSourceRef.current = null;
      } catch (error) {
        console.warn('Error stopping audio source:', error);
      }
    }
    
    // Clear the queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    
    console.log('✅ Immediate interruption completed');
  }, [addTranscriptionEntry]);

  // High-quality audio playback
  const playAudioWithHighQuality = useCallback(async (audioBlob: Blob): Promise<boolean> => {
    try {
      if (shouldInterruptRef.current) {
        console.log('🚫 Skipping audio due to interruption flag');
        return false;
      }

      await initializeAudioContext();
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // High-quality audio decoding with enhanced error handling
      const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer,
        // Success callback
        (decodedBuffer) => decodedBuffer,
        // Error callback
        (error) => {
          console.warn('High-quality audio decode failed:', error);
          throw error;
        }
      );
      
      console.log(`🎵 High-quality audio: duration=${audioBuffer.duration}s, sampleRate=${audioBuffer.sampleRate}Hz, channels=${audioBuffer.numberOfChannels}`);
      
      if (shouldInterruptRef.current) {
        console.log('🚫 Interruption detected after decoding, aborting playback');
        return false;
      }
      
      const source = audioContextRef.current!.createBufferSource();
      source.buffer = audioBuffer;
      
      // Ensure highest quality playback settings
      source.playbackRate.value = 1.0; // No speed modification
      source.detune.value = 0; // No pitch modification
      
      // Connect with full volume for maximum clarity
      source.connect(gainNodeRef.current!);
      gainNodeRef.current!.gain.value = 1.0; // Full volume, no attenuation
      
      currentAudioSourceRef.current = source;
      
      source.onended = () => {
        console.log('🔚 High-quality audio ended');
        // Stop AI speech transcription when audio ends
        stopAISpeechTranscription();
        currentAudioSourceRef.current = null;
        isPlayingRef.current = false;
        shouldInterruptRef.current = false;
        setTimeout(playNext, 1);
      };
      
      source.start(0);
      console.log('▶️ High-quality audio started');
      
      // Call callback if provided
      onAudioReceived?.(audioBlob);
      
      return true;
      
    } catch (error) {
      console.error('❌ High-quality audio playback failed:', error);
      shouldInterruptRef.current = false;
      return false;
    }
  }, [initializeAudioContext, onAudioReceived]);

  // Queue processing - using Blob directly
  const playNext = useCallback(async () => {
    if (shouldInterruptRef.current) {
      console.log('🚫 Queue processing stopped due to interruption');
      return;
    }

    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    const item = audioQueueRef.current.shift();
    if (!item) return;

    console.log(`▶️ Playing: ${item.type}, format: ${item.mimeType}`);
    isPlayingRef.current = true;

    try {
      if (shouldInterruptRef.current) {
        console.log('🚫 Interruption detected, aborting playback');
        isPlayingRef.current = false;
        return;
      }
      
      // Use the Blob directly instead of re-fetching from URL
      await playAudioWithHighQuality(item.blob);
    } catch (error) {
      console.warn('Enhanced audio failed:', error);
      isPlayingRef.current = false;
      shouldInterruptRef.current = false;
      setTimeout(playNext, 1);
    }
  }, [playAudioWithHighQuality]);

  // Add audio to queue - using Blob directly
  const addToQueue = useCallback((audioBlob: Blob, type = 'audio', mimeType = 'audio/wav') => {
    if (shouldInterruptRef.current) {
      console.log('🚫 Skipping queue addition due to interruption');
      return;
    }
    
    console.log(`🎵 Adding to queue: type=${type}, size=${audioBlob.size} bytes, mime=${mimeType}`);
    
    audioQueueRef.current.push({ type, blob: audioBlob, mimeType });
    
    if (!isPlayingRef.current) {
      playNext();
    }
  }, [playNext]);

  // Enhanced speech detection with browser-optimized settings
  const startSpeechDetection = useCallback((stream: MediaStream) => {
    try {
      if (!speechContextRef.current || speechContextRef.current.state === 'closed') {
        speechContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          latencyHint: 'interactive'
        });
      }
      
      const sourceNode = speechContextRef.current.createMediaStreamSource(stream);
      const analyser = speechContextRef.current.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      sourceNode.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkAudioLevel = () => {
        if (speechContextRef.current?.state !== 'running') return;
        
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate RMS for better speech detection
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);
        
        // Log audio levels periodically for TEXT agents (for debugging)
        if ((agentDetails?.agent_type === 'TEXT' || agentDetails?.type === 'TEXT') && Math.random() < 0.05) { // 5% chance to log
          console.log(`🔊 TEXT Agent - User audio level: ${rms.toFixed(1)}, Speaking: ${isUserSpeakingRef.current}, Threshold: 35`);
        }
        
        // Enhanced speech detection threshold - more sensitive for better user experience
        if (rms > 35 && !isUserSpeakingRef.current) { // Lowered from 60 to 35 for easier detection
          speechFramesRef.current++;
          silenceFramesRef.current = 0;
          if (speechFramesRef.current >= 3) { // Lowered from 8 to 3 frames for faster response
            isUserSpeakingRef.current = true;
            startUserSpeechTranscription();
            if (agentDetails?.agent_type !== 'TEXT' && agentDetails?.type !== 'TEXT') {
              console.log('🎤 User started speaking - pausing AI speech recognition');
              // No AI speech recognition to pause here, as it's handled by LiveKit
            }
          }
        } else if (rms < 20 && isUserSpeakingRef.current) { // Lowered from 30 to 20 for better silence detection
          silenceFramesRef.current++;
          speechFramesRef.current = 0;
          const requiredSilenceFrames = (agentDetails?.agent_type === 'TEXT' || agentDetails?.type === 'TEXT') ? 100 : 80; // Reduced silence requirement
          if (silenceFramesRef.current >= requiredSilenceFrames) {
            isUserSpeakingRef.current = false;
            stopUserSpeechTranscription();
            console.log('🤫 User stopped speaking');
            if (agentDetails?.agent_type !== 'TEXT' && agentDetails?.type !== 'TEXT') {
              console.log('🤖 Resuming AI speech recognition');
              // No AI speech recognition to restart here, as it's handled by LiveKit
            } else {
              // For TEXT agents, don't restart AI speech recognition here
              // AI speech recognition should only be created when AI audio tracks are received
              console.log('🤖 User stopped speaking in TEXT agent session - AI recognition will be handled by audio tracks');
              // Add a small delay before allowing AI to continue to prevent false interruptions
              setTimeout(() => {
                console.log('🔄 Ready for AI response after user speech');
              }, 1000); // 1 second delay
            }
          }
        } else {
          // Reset counters if neither clear speech nor silence
          speechFramesRef.current = 0;
          silenceFramesRef.current = 0;
        }
        
        requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
      
    } catch (error) {
      console.warn('Enhanced speech detection setup failed:', error);
    }
  }, [agentDetails]);

  const startUserSpeechTranscription = useCallback(() => {
    if (!isUserSpeakingForTranscriptionRef.current) {
      isUserSpeakingForTranscriptionRef.current = true;
      userTranscriptionAddedRef.current = false; // Reset flag
      speechStartTimeRef.current = Date.now();
      currentUserSpeechRef.current = '';
      console.log('🎤 Started user speech transcription (LiveKit native)');
    }
  }, []);

  const stopUserSpeechTranscription = useCallback(() => {
    if (isUserSpeakingForTranscriptionRef.current) {
      // LiveKit handles transcription lifecycle automatically
      console.log('🎤 User speech transcription stopped (LiveKit native)');
      isUserSpeakingForTranscriptionRef.current = false;
    }
  }, []);

  const startAISpeechTranscription = useCallback(() => {
    if (!isAISpeakingForTranscriptionRef.current) {
      isAISpeakingForTranscriptionRef.current = true;
      aiResponseStartTimeRef.current = Date.now();
      currentAISpeechRef.current = '';
      console.log('🤖 Started AI speech transcription (LiveKit native)');
    }
  }, []);

  const stopAISpeechTranscription = useCallback(() => {
    if (isAISpeakingForTranscriptionRef.current) {
      const duration = (Date.now() - aiResponseStartTimeRef.current) / 1000;
      
      // For TEXT agents, we need to get the response from the agent
      // Since we don't have the actual text, we'll add a placeholder
      // In a real implementation, you'd get this from the agent's response
      if (currentAISpeechRef.current.trim()) {
        addTranscriptionEntry('ai', currentAISpeechRef.current.trim(), duration, undefined, true, 'livekit');
        console.log('🤖 Added AI transcription:', currentAISpeechRef.current.trim());
      } else {
        // Skip adding placeholder - only add meaningful content
        console.log(`🤖 Skipping AI transcription placeholder (duration: ${duration}s)`);
      }
      
      isAISpeakingForTranscriptionRef.current = false;
      currentAISpeechRef.current = '';
      
      console.log('🔇 Stopped AI speech transcription (LiveKit native)');
    }
  }, [addTranscriptionEntry]);

  const updateUserSpeechTranscription = useCallback((text: string) => {
    if (isUserSpeakingForTranscriptionRef.current) {
      currentUserSpeechRef.current = text;
    }
  }, []);

  const updateAISpeechTranscription = useCallback((text: string) => {
    if (isAISpeakingForTranscriptionRef.current) {
      currentAISpeechRef.current = text;
      console.log('🤖 Updated AI speech transcription:', text);
    }
  }, []);

  // Method to add AI response text for TEXT agents
  const addAIResponseText = useCallback((text: string) => {
    if (isAISpeakingForTranscriptionRef.current) {
      currentAISpeechRef.current = text;
      console.log('🤖 Added AI response text:', text);
    } else {
      // If AI is not currently speaking, start transcription and add text
      startAISpeechTranscription();
      currentAISpeechRef.current = text;
      console.log('🤖 Started AI transcription with text:', text);
    }
  }, [startAISpeechTranscription]);

  // Method to handle when AI starts speaking (for TEXT agents)
  const onAIStartsSpeaking = useCallback(() => {
    console.log('🤖 AI started speaking - starting transcription');
    startAISpeechTranscription();
  }, [startAISpeechTranscription]);

  // Method to handle when AI stops speaking (for TEXT agents)
  const onAIStopsSpeaking = useCallback(() => {
    console.log('🤖 AI stopped speaking - stopping transcription');
    stopAISpeechTranscription();
    
    // Small delay before allowing user speech to start again
    setTimeout(() => {
      console.log('🔄 Ready for user speech after AI response');
    }, 500);
  }, [stopAISpeechTranscription]);

  const saveTranscription = useCallback(async () => {
    if (transcription.length === 0) {
      console.log('📝 No transcription to save');
      return;
    }

    try {
      // Create a formatted transcription text with only final, meaningful entries
      const finalEntries = transcription.filter(entry => 
        cleanTranscriptionText(entry.text).length > 0 && entry.isFinal === true
      );
      
      if (finalEntries.length === 0) {
        console.log('📝 No final transcription to save');
        toast.info('No final transcription to save');
        return;
      }

      const formattedText = finalEntries.map(entry => {
        const time = entry.timestamp.toLocaleTimeString();
        const speaker = entry.speaker === 'user' ? 'User' : 'Web Agent';
        const duration = entry.duration ? ` (${entry.duration.toFixed(1)}s)` : '';
        const confidence = entry.confidence ? ` [${(entry.confidence * 100).toFixed(1)}%]` : '';
        const source = entry.source ? ` [${entry.source.toUpperCase()}]` : '';
        const participant = entry.participantId ? ` (${entry.participantId})` : '';
        const cleanText = cleanTranscriptionText(entry.text);
        return `[${time}] ${speaker}${duration}${confidence}${source}${participant}: ${cleanText}`;
      }).join('\n\n');

      // Create a blob with the transcription
      const blob = new Blob([formattedText], { type: 'text/plain' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enhanced_transcription_${agentId || 'session'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('💾 Enhanced transcription saved successfully');
      toast.success('Enhanced transcription saved successfully!');
    } catch (error) {
      console.error('❌ Error saving transcription:', error);
      toast.error('Failed to save transcription');
    }
  }, [transcription, agentId, cleanTranscriptionText]);

  const clearTranscription = useCallback(() => {
    setTranscription([]);
    currentUserSpeechRef.current = '';
    currentAISpeechRef.current = '';
    isUserSpeakingForTranscriptionRef.current = false;
    isAISpeakingForTranscriptionRef.current = false;
    console.log('🧹 Transcription cleared');
  }, []);



  const stopSpeechDetection = useCallback(() => {
    if (speechContextRef.current && speechContextRef.current.state !== 'closed') {
      try {
        speechContextRef.current.close();
        speechContextRef.current = null;
      } catch (error) {
        console.warn('Error closing speech context:', error);
      }
    }
    
    isUserSpeakingRef.current = false;
  }, []);

  // Optimized Base64 to Blob conversion for maximum audio quality preservation
  const base64ToBlob = useCallback((base64: string, mime = 'audio/wav'): Blob | null => {
    try {
      // Clean base64 data more efficiently
      const base64Data = base64.replace(/^data:audio\/[^;]+;base64,/, '');
      
      // Use more efficient binary conversion
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      // Faster byte conversion
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Preserve original audio format and quality
      return new Blob([bytes], { 
        type: mime.includes('webm') ? mime : 'audio/wav' // Ensure proper MIME type
      });
    } catch (error) {
      console.error('Error converting base64 to blob:', error);
      return null;
    }
  }, []);

  // Real-time audio streaming for immediate playback
  const streamAudioChunk = useCallback(async (audioBlob: Blob, mimeType = 'audio/wav') => {
    try {
      // Skip if interrupted
      if (shouldInterruptRef.current) {
        console.log('🚫 Skipping audio chunk due to interruption');
        return;
      }

      await initializeAudioContext();
      
      // Decode the audio with high-quality settings
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Use high-quality audio decoding with error handling
      const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer, 
        // Success callback - ensure no quality loss
        (decodedBuffer) => decodedBuffer,
        // Error callback with fallback
        (error) => {
          console.warn('Primary audio decode failed, trying fallback:', error);
          throw error;
        }
      );
      
      console.log(`🎵 Real-time chunk: duration=${audioBuffer.duration.toFixed(3)}s, size=${audioBlob.size} bytes, sampleRate=${audioBuffer.sampleRate}Hz, channels=${audioBuffer.numberOfChannels}`);
      
      // Check for interruption after decoding
      if (shouldInterruptRef.current) {
        console.log('🚫 Interruption detected after decoding, aborting playback');
        return;
      }
      
      // Initialize next play time if this is the first chunk
      if (nextPlayTimeRef.current === 0) {
        nextPlayTimeRef.current = audioContextRef.current!.currentTime + 0.02; // 20ms buffer for reliable start without stutter
        console.log(`⏰ Started real-time stream at ${nextPlayTimeRef.current.toFixed(3)}s`);
      }
      
      // Create buffer source with high-quality settings
      const source = audioContextRef.current!.createBufferSource();
      source.buffer = audioBuffer;
      
      // Preserve audio quality - no resampling or modification
      source.playbackRate.value = 1.0; // Original speed
      source.detune.value = 0; // No pitch modification
      
      // Connect directly for best quality
      source.connect(gainNodeRef.current!);
      
      // Schedule for immediate playback with precise timing
      source.start(nextPlayTimeRef.current);
      console.log(`▶️ Scheduled chunk at ${nextPlayTimeRef.current.toFixed(3)}s (duration: ${audioBuffer.duration.toFixed(3)}s)`);
      
      // Update next play time for seamless transition with timing correction
      const expectedEndTime = nextPlayTimeRef.current + audioBuffer.duration;
      const currentTime = audioContextRef.current!.currentTime;
      
      // Prevent timing drift by adjusting for any delays
      if (expectedEndTime < currentTime) {
        // We're behind schedule, catch up
        nextPlayTimeRef.current = currentTime + 0.001; // Tiny buffer
        console.log(`⚠️ Timing drift detected, correcting: expected=${expectedEndTime.toFixed(3)}, current=${currentTime.toFixed(3)}`);
              } else {
        nextPlayTimeRef.current = expectedEndTime;
      }
      
      // Handle end event
      source.onended = () => {
        console.log('🔚 Chunk ended');
        // Continue with next chunk if available
        if (audioStreamQueue.current.length > 0 && !shouldInterruptRef.current) {
          const nextChunk = audioStreamQueue.current.shift();
          streamAudioChunk(nextChunk!.blob, nextChunk!.mimeType);
        } else if (audioStreamQueue.current.length === 0) {
          // Stop AI speech transcription when stream ends
          // No AI speech recognition to stop here, as it's handled by LiveKit
          // Reset timing when stream ends
          nextPlayTimeRef.current = 0;
          lastChunkEndTimeRef.current = 0;
          console.log('⏰ Stream ended - reset timing');
        }
      };

      currentAudioSourceRef.current = source;

    } catch (error) {
      console.error('❌ Real-time audio streaming failed:', error);
    }
  }, [initializeAudioContext]);

  // Function to clear cached permissions (useful for testing or when permissions change)
  const clearCachedPermissions = useCallback(() => {
    localStorage.removeItem('microphonePermission');
    setHasPermissions(false);
    console.log('🧹 Cached microphone permissions cleared');
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 Starting enhanced cleanup');

    // Clear all audio queues and reset timing
    audioQueueRef.current = [];
    audioStreamQueue.current = [];
    nextPlayTimeRef.current = 0;
    lastChunkEndTimeRef.current = 0;
    isPlayingRef.current = false;
    isStreamingRef.current = false;

    executeImmediateInterruption();
    stopSpeechDetection();

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
        audioContextRef.current = null;
        gainNodeRef.current = null;
      } catch (error) {
        console.warn('Error closing audio context:', error);
      }
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.warn('Error stopping media recorder:', error);
      }
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (error) {
          console.warn('Error stopping track:', error);
        }
      });
    }

    // Close WebSocket (SPEECH agents)
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }

    // Disconnect from LiveKit room (TEXT agents)
    if (roomRef.current) {
      console.log('🔌 Disconnecting from LiveKit room...');
      
      // Clean up any audio elements created for TEXT agent
      const audioElements = document.querySelectorAll('audio[data-livekit-track]');
      audioElements.forEach((element, index) => {
        console.log(`🧹 Cleaning up TEXT agent audio element ${index}`);
        element.remove();
      });
      
      roomRef.current.disconnect();
      roomRef.current = null;
      console.log('✅ Disconnected from LiveKit room');
    }

    // Reset flags
    shouldInterruptRef.current = false;
    isPlayingRef.current = false;
    isUserSpeakingRef.current = false;
    setHasPermissions(false);
    
    // Clear transcription
    clearTranscription();
    
    // Stop speech recognition
    // No speech recognition to stop here, as it's handled by LiveKit
    // if (speechRecognitionRef.current) {
    //   try {
    //     speechRecognitionRef.current.stop();
    //     speechRecognitionRef.current = null;
    //     console.log('�� Speech recognition stopped during cleanup');
    //   } catch (error) {
    //     console.warn('Error stopping speech recognition during cleanup:', error);
    //   }
    // }

    // Stop AI speech recognition
    // No AI speech recognition to stop here, as it's handled by LiveKit
    // if (aiSpeechRecognitionRef.current) {
    //   try {
    //     aiSpeechRecognitionRef.current.stop();
    //     aiSpeechRecognitionRef.current = null;
    //     aiSpeechRecognitionActiveRef.current = false;
    //     console.log('🤖 AI speech recognition stopped during cleanup');
    //   } catch (error) {
    //     console.warn('Error stopping AI speech recognition during cleanup:', error);
    //   }
    // }

    // Stop LiveKit transcription
    // No LiveKit transcription to stop here, as it's handled by LiveKit
    // if (liveKitTranscriptionRef.current) {
    //   try {
    //     liveKitTranscriptionRef.current.stop();
    //     liveKitTranscriptionRef.current = null;
    //     console.log('🎤 LiveKit transcription stopped during cleanup');
    //   } catch (error) {
    //     console.warn('Error stopping LiveKit transcription during cleanup:', error);
    //   }
    // }

    console.log('✅ Cleanup completed');
  }, [executeImmediateInterruption, stopSpeechDetection, clearTranscription]);

  // Connect to LiveKit room for TEXT agents with native transcription integration
  const connectToLiveKitRoom = useCallback(async (sessionData: any) => {
    try {
      console.log('🔗 Connecting to LiveKit room for TEXT agent with native transcription...');
      const room = new Room();
      roomRef.current = room;

      // Set up LiveKit transcription event listeners
      room.on(RoomEvent.TranscriptionReceived, (segments: TranscriptionSegment[], participant, publication) => {
        console.log('📝 LiveKit transcription received:', {
          segmentsCount: segments.length,
          participantId: participant?.identity,
          trackId: publication?.trackSid,
          segments: segments.map(s => ({
            id: s.id,
            text: s.text,
            final: s.final,
            startTime: s.startTime,
            endTime: s.endTime,
            language: s.language
          }))
        });

        // Process each transcription segment
        segments.forEach(segment => {
          // Determine speaker type based on participant ID
          const speaker = participant?.identity?.includes('agent') || participant?.identity?.includes('ai') ? 'ai' : 'user';
          
          // Add transcription entry with LiveKit data
          addTranscriptionEntry(
            speaker,
            segment.text,
            segment.endTime ? (segment.endTime - segment.startTime) / 1000 : undefined, // duration in seconds
            undefined, // confidence not provided by LiveKit
            segment.final,
            'livekit',
            participant?.identity,
            publication?.trackSid
          );

          // Update current speech tracking
          if (speaker === 'user') {
            currentUserSpeechRef.current = segment.text;
            if (segment.final) {
              userTranscriptionAddedRef.current = true;
            }
          } else if (speaker === 'ai') {
            currentAISpeechRef.current = segment.text;
            if (segment.final) {
              aiTranscriptionAddedRef.current = true;
            }
          }
        });
      });

      // Set up other event listeners
      room.on(RoomEvent.Connected, async () => {
        console.log('✅ Connected to LiveKit room for TEXT agent');
        console.log('🏠 Room details:', {
          name: room.name,
          participants: room.numParticipants,
          localParticipant: room.localParticipant.identity
        });

        // Enable microphone for user input detection
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
          setHasPermissions(true);
          console.log('🎤 Microphone enabled for TEXT agent user input (audio only)');
          
          // Start real-time speaking detection for TEXT agent
          const audioTracks = room.localParticipant.audioTrackPublications;
          if (audioTracks.size > 0) {
            const audioTrack = Array.from(audioTracks.values())[0].track;
            if (audioTrack?.mediaStream) {
              startSpeechDetection(audioTrack.mediaStream);
              console.log('🎯 Started real-time speaking detection for TEXT agent');
              console.log('🎤 User microphone stream detected - using LiveKit native transcription');
            }
          }
        } catch (error) {
          console.error('❌ Failed to enable microphone for TEXT agent:', error);
          setHasPermissions(false);
          throw new Error('Failed to enable microphone for TEXT agent');
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('🔌 Disconnected from LiveKit room');
        setIsConnected(false);
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('👤 Participant joined:', participant.identity);
        if (participant.identity.startsWith('agent_') || participant.identity.includes('agent')) {
          console.log('🤖 TEXT Agent participant detected:', participant.identity);
        }
      });

      // Handle audio tracks from agent (TEXT-to-Speech output)
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio && participant.identity.includes('agent')) {
          console.log('🎵 TEXT Agent audio track received:', {
            participantId: participant.identity,
            trackSid: publication.trackSid,
            trackName: publication.trackName,
            muted: publication.isMuted,
            enabled: publication.isEnabled
          });
      
          // Create audio element for playback
          const audioElement = track.attach() as HTMLAudioElement;
          audioElement.autoplay = true;
          audioElement.volume = 1.0;
          audioElement.setAttribute('data-livekit-track', 'text-agent-audio');
      
          // Create a MediaStream from the audio element for speech recognition
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioContext.createMediaElementSource(audioElement);
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);
          const capturedStream = destination.stream;
      
          // LiveKit handles speech recognition, so we just need to listen for events
          // We don't need to instantiate a new one here unless we want to manage its state
          // For now, we'll rely on LiveKit's native transcription.
          console.log('🎤 Enhanced user speech recognition handled by LiveKit native transcription');
      
          audioElement.onplay = () => {
            console.log('▶️ TEXT Agent audio started playing');
            startAISpeechTranscription();
            onAIStartsSpeaking();
          };
      
          audioElement.onended = () => {
            console.log('🔚 TEXT Agent audio ended');
            // Don't add transcription here since we only get final results now
            onAIStopsSpeaking();
          };
      
          audioElement.onerror = (error) => {
            console.error('❌ TEXT Agent audio error:', error);
          };
      
          document.body.appendChild(audioElement);
          console.log('🔊 TEXT Agent audio element attached to DOM');
        }
      });

      // Monitor local audio (user speaking detection)
      room.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
        if (publication.track?.kind === Track.Kind.Audio) {
          console.log('📤 User audio track published for TEXT agent:', {
            trackSid: publication.trackSid,
            trackName: publication.trackName,
            participant: participant.identity,
            muted: publication.isMuted,
            enabled: publication.isEnabled
          });
          
          // Start real-time speaking detection when audio track is published
          if (publication.track?.mediaStream) {
            startSpeechDetection(publication.track.mediaStream);
            console.log('🎯 Started real-time speaking detection for newly published TEXT agent audio track');
          }
        }
      });

      room.on(RoomEvent.TrackMuted, (publication, participant) => {
        if (publication.kind === Track.Kind.Audio && participant.isLocal) {
          console.log('🔇 User audio muted in TEXT agent session');
        }
      });

      room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
        if (publication.kind === Track.Kind.Audio && participant.isLocal) {
          console.log('🎤 User audio unmuted in TEXT agent session');
        }
      });

      // Connect to room - LiveKit handles all audio automatically
      await room.connect(sessionData.url, sessionData.token);
      console.log('✅ Successfully connected to LiveKit room for TEXT agent');

    } catch (error) {
      console.error('❌ Error connecting to LiveKit room:', error);
      throw new Error('Failed to connect to LiveKit room');
    }
  }, [startSpeechDetection]);



  // Start inference connection
  const startInference = useCallback(async (targetAgentId?: string) => {
    const currentAgentId = targetAgentId || agentId;
    if (!currentAgentId) {
      toast.error("Agent ID is required for inference");
      return;
    }

    try {
      setInferenceState("CONNECTING");
      setIsLoading(true);

      // Use provided agent data or fetch agent details to determine the correct approach
      let agentInfo = null;
      
      // For public inference, we need to fetch the agent data if not already provided
      if (agentData) {
        // Use pre-fetched agent data (for public inference)
        agentInfo = agentData;
        setAgentDetails(agentInfo);
        console.log('📋 Using provided agent details:', agentInfo);
      } else {
        // Try to fetch agent data using public API first (for public inference)
        try {
          console.log('🌐 Attempting to fetch agent data using public API...');
          const publicAgentInfo = await publicAgentAPI.getAgent(currentAgentId);
          agentInfo = publicAgentInfo;
          setAgentDetails(agentInfo);
          console.log('📋 Agent details fetched via public API:', agentInfo);
        } catch (publicError) {
          console.log('🔐 Public API failed, trying authenticated API...');
          // Fall back to authenticated API
          try {
            agentInfo = await agentAPI.getAgent(currentAgentId);
            setAgentDetails(agentInfo);
            console.log('📋 Agent details fetched via authenticated API:', agentInfo);
          } catch (error) {
            console.warn('Failed to fetch agent details, using default endpoint:', error);
            // Continue with default endpoint if agent fetch fails
          }
        }
      }
      
      const agentType = (agentInfo?.agent_type || agentInfo?.type || 'SPEECH')?.toString()?.trim();
      console.log(`📡 Agent type detected: ${agentType}`);

      // For TEXT agents, use clean LiveKit session approach (like VoiceAssistant)
      if (agentType?.toUpperCase() === 'TEXT') {
        console.log('🔗 TEXT agent detected - using LiveKit session approach');
        
        let sessionData;
        
        // Simple logic: if authToken exists, use private endpoint, otherwise use public endpoint
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
          console.log('🔐 Using authenticated LiveKit session for private inference');
          // Start LiveKit session for TEXT agent using the API service with automatic token refresh
          try {
            sessionData = await liveKitAPI.createSession(currentAgentId, `User_${Date.now()}`);
          } catch (error: any) {
            console.error('Failed to start LiveKit session:', error);
            throw new Error(error.response?.data?.detail || error.message || 'Failed to start LiveKit session for TEXT agent');
          }
        } else {
          console.log('🌐 Using public LiveKit session for public inference');
          sessionData = await publicAgentAPI.createLiveKitSession(currentAgentId);
        }
        
        console.log('📋 LiveKit session created for TEXT agent:', sessionData);
        setSessionData(sessionData);
        
        // Connect to LiveKit room (let LiveKit handle all audio)
        await connectToLiveKitRoom(sessionData);
        
        setInferenceState("ACTIVE");
        setIsConnected(true);
        toast.success("TEXT agent session started successfully!");
        
        return; // Exit early for TEXT agents - no WebSocket or custom audio needed
      }

      // For SPEECH agents, continue with the existing WebSocket approach
      console.log('🔗 SPEECH agent detected - using WebSocket approach');
      
      // Get microphone access with high-quality audio settings and permission caching
      let stream: MediaStream;
      
      // Check if we already have permission cached
      const cachedPermission = localStorage.getItem('microphonePermission');
      if (cachedPermission === 'granted') {
        console.log('🎤 Using cached microphone permission for SPEECH agent');
        setHasPermissions(true);
      } else {
        console.log('🎤 Requesting microphone permission for SPEECH agent...');
      }
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            sampleRate: 48000, // High sample rate for crisp input
            sampleSize: 16, // 16-bit audio depth
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false   // <- turn off AGC
          }
        });
        
        // Cache the permission status and update state
        localStorage.setItem('microphonePermission', 'granted');
        setHasPermissions(true);
        console.log('✅ Microphone permission granted and cached for SPEECH agent');
      } catch (error) {
        console.error('❌ Failed to get microphone permission:', error);
        setHasPermissions(false);
        localStorage.removeItem('microphonePermission');
        throw new Error('Microphone permission denied. Please allow microphone access to use the voice assistant.');
      }

      mediaStreamRef.current = stream;

      // Start speech detection
      startSpeechDetection(stream);

      // Create WebSocket connection for SPEECH agents
      const wsUrl = config.getHumeWebSocketUrl(currentAgentId, agentType);
      const endpointInfo = config.getEndpointInfo(agentType);
      
      console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);
      console.log(`📡 Agent routing info:`, endpointInfo);
      const socket = new WebSocket(wsUrl);

      socketRef.current = socket;



      // Wait for connection

      await new Promise<void>((resolve, reject) => {

        socket.onopen = () => {

          console.log('✅ WebSocket connected');

          setIsConnected(true);

          resolve();

        };

        socket.onerror = (error) => {

          console.error('❌ WebSocket error:', error);

          reject(error);

        };

      });



      // Handle WebSocket messages

      socket.onmessage = async (event) => {

        try {

          // Handle binary data (audio)

          if (event.data instanceof Blob) {

            addToQueue(event.data, 'audio');

            return;

          }



          if (event.data instanceof ArrayBuffer) {

            const audioBlob = new Blob([event.data], { type: 'audio/webm;codecs=opus' });

            addToQueue(audioBlob, 'audio');

            return;

          }

            

          // Handle JSON messages

          const data = JSON.parse(event.data);



          // Handle interruption

          if (data.interrupt || data.type === "interruption") {

            console.log('🚨 Server interruption received');

            executeImmediateInterruption();

            return;

          }



          // Handle audio chunks with real-time streaming and quality preservation
          if (data.audio) {
            // Start AI speech transcription when first audio chunk is received
            if (nextPlayTimeRef.current === 0) {
              startAISpeechTranscription();
            }
            
            // Detect and preserve the best audio format from VoiceCake
            const audioFormat = data.audio_format || data.format || 'audio/wav';
            const isHighQualityFormat = audioFormat.includes('webm') || audioFormat.includes('opus') || audioFormat.includes('mp3');

            console.log('📡 Received Audio Data:', {
              dataLength: data.audio.length,
              audioFormat: audioFormat,
              isHighQuality: isHighQualityFormat,
              chunksCombined: data.chunks_combined,
              totalSize: data.total_size,
              segmentType: data.segment_type,
              hasAudio: !!data.audio,
              bitrate: data.bitrate || 'unknown'
            });

            

            const audioBlob = base64ToBlob(data.audio, audioFormat);

            if (audioBlob) {
              // Manage queue size to prevent audio buildup and distortion
              const MAX_QUEUE_SIZE = 8; // Allow a larger but bounded queue

              if (nextPlayTimeRef.current === 0) {
                // First chunk - start streaming immediately
                streamAudioChunk(audioBlob, audioFormat);
              } else if (audioStreamQueue.current.length < MAX_QUEUE_SIZE) {
                // Only queue if under limit to prevent audio distortion
                audioStreamQueue.current.push({ blob: audioBlob, mimeType: audioFormat });
                console.log(`📦 Queued chunk for streaming, queue size: ${audioStreamQueue.current.length}`);
              } else {
                // Queue is full: still enqueue latest to keep audio flowing, but drop oldest to cap latency
                audioStreamQueue.current.push({ blob: audioBlob, mimeType: audioFormat });
                console.log(`🔄 Queue full, dropped oldest. Queue size: ${audioStreamQueue.current.length}`);
              }
            }

            return;

          }







        } catch (error) {

          console.error('Error processing message:', error);

        }

      };



      // Handle WebSocket close

      socket.onclose = (event) => {

        console.warn('WebSocket closed:', event.code, event.reason);

        setIsConnected(false);

        stopInference();

      };



      // Set up media recorder with high-quality settings for maximum audio fidelity
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 256000, // Higher bitrate for better quality
        bitsPerSecond: 256000 // Ensure high overall bitrate
      });

      mediaRecorderRef.current = mediaRecorder;



      mediaRecorder.ondataavailable = (event) => {

        if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {

          socket.send(event.data);

        }

      };



      mediaRecorder.onstop = () => {

        console.log('🔴 MediaRecorder stopped');

        if (socket.readyState === WebSocket.OPEN) {

          socket.close();

        }

      };



      mediaRecorder.start(100); // Reduced to 100ms chunks for better real-time response
      setInferenceState("ACTIVE");

      setIsLoading(false);

      toast.success("Inference started successfully!");



    } catch (error) {

      console.error('Error starting inference:', error);

      cleanup();

      toast.error("Failed to start inference connection");

      setInferenceState("ERROR");

      setIsLoading(false);

    }

  }, [agentId, startSpeechDetection, addToQueue, base64ToBlob, executeImmediateInterruption, cleanup, streamAudioChunk, connectToLiveKitRoom]);



  // Stop inference

  const stopInference = useCallback(async () => {
    // Stop any ongoing transcription
    stopUserSpeechTranscription();
    stopAISpeechTranscription();
    
    // Ensure AI speech recognition is properly stopped
    // No AI speech recognition to stop here, as it's handled by LiveKit
    // if (aiSpeechRecognitionRef.current && aiSpeechRecognitionActiveRef.current) {
    //   try {
    //     aiSpeechRecognitionRef.current.stop();
    //     aiSpeechRecognitionActiveRef.current = false;
    //     console.log('🤖 AI speech recognition stopped during inference stop');
    //   } catch (error) {
    //     console.warn('Error stopping AI speech recognition during inference stop:', error);
    //   }
    // }
    
    // Save transcription if there's content
    if (transcription.length > 0) {
      await saveTranscription();
    }
    
    // For TEXT agents using LiveKit sessions, properly end the session
    if ((agentDetails?.agent_type === 'TEXT' || agentDetails?.type === 'TEXT') && sessionData) {
      try {
        // End the LiveKit session on the server (following VoiceAssistant pattern)
        const response = await fetch(`${config.api.baseURL}/livekit/session/${sessionData.session_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
        });
        
        if (response.ok) {
          console.log('✅ LiveKit session ended successfully for TEXT agent');
        } else {
          console.warn('⚠️ Failed to end LiveKit session properly');
        }
      } catch (error) {
        console.warn('⚠️ Error ending LiveKit session:', error);
      }
    }

    cleanup();
    setSessionData(null);
    setInferenceState("IDLE");
    setIsLoading(false);
    setIsMicOn(true);
    setIsConnected(false);
    setHasPermissions(false);
    toast.success("Inference stopped");

  }, [cleanup, agentDetails, sessionData, transcription, saveTranscription, stopUserSpeechTranscription, stopAISpeechTranscription]);



  // Toggle microphone

  const toggleMic = useCallback(() => {

    const stream = mediaStreamRef.current;

    if (stream) {

      stream.getAudioTracks().forEach((track) => {

        track.enabled = !track.enabled;

        setIsMicOn(track.enabled);

      });

      

      if (isMicOn) {

        toast.success("Microphone muted");

      } else {
        toast.success("Microphone unmuted");
      }
    }
  }, [isMicOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);


  return {
    inferenceState,
    isLoading,
    isMicOn,
    isConnected,
    isUserSpeaking: isUserSpeakingRef.current,
    hasPermissions,
    startInference,
    stopInference,
    toggleMic,
    clearCachedPermissions,
    sessionData, // Expose session data for TEXT agents
    mediaStream: mediaStreamRef.current,
    // Enhanced transcription data and methods
    transcription,
    isTranscribing,
    saveTranscription,
    clearTranscription,
    addAIResponseText, // Method to add AI response text for TEXT agents
    onAIStartsSpeaking, // Method to handle AI speech start
    onAIStopsSpeaking, // Method to handle AI speech stop
    transcriptionUpdateTrigger
  };

};

export default useHumeInference;