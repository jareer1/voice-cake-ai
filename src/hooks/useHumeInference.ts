import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import config from "@/lib/config";
import { agentAPI } from "@/pages/services/api";
import { Room, RoomEvent, Track, RemoteAudioTrack, RemoteParticipant } from 'livekit-client';

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

  // Immediate interruption for real-time response
  const executeImmediateInterruption = useCallback(() => {
    console.log('🚨 IMMEDIATE INTERRUPTION - stopping all audio NOW');
    
    shouldInterruptRef.current = true;
    
    // Clear stream queue and reset timing
    audioStreamQueue.current = [];
    nextPlayTimeRef.current = 0;
    lastChunkEndTimeRef.current = 0;
    
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
  }, []);

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
          console.log(`🔊 TEXT Agent - User audio level: ${rms.toFixed(1)}, Speaking: ${isUserSpeakingRef.current}, Threshold: 40`);
        }
        
        // Enhanced speech detection threshold - increased sensitivity to avoid background noise
        if (rms > 40 && !isUserSpeakingRef.current) { // Increased threshold to avoid background noise
          speechFramesRef.current++;
          silenceFramesRef.current = 0;
          
          // Require 5 consecutive speech frames to confirm speaking (more reliable detection)
          if (speechFramesRef.current >= 5) {
            isUserSpeakingRef.current = true;
            // For TEXT agents, just log speaking detection (no interruption needed)
            if (agentDetails?.agent_type === 'TEXT' || agentDetails?.type === 'TEXT') {
              console.log('🎤 User started speaking in TEXT agent session');
            } else {
              console.log('🎤 User started speaking - IMMEDIATE interruption');
              executeImmediateInterruption();
            }
          }
        } else if (rms < 25 && isUserSpeakingRef.current) { // Increased threshold for silence detection
          silenceFramesRef.current++;
          speechFramesRef.current = 0;
          
          // Require 8 consecutive silence frames to confirm stopped speaking
          if (silenceFramesRef.current >= 8) {
            isUserSpeakingRef.current = false;
            // For TEXT agents, just log speaking detection
            if (agentDetails?.agent_type === 'TEXT' || agentDetails?.type === 'TEXT') {
              console.log('🤫 User stopped speaking in TEXT agent session');
            } else {
              console.log('🤫 User stopped speaking');
              // Reset interruption flag after a short delay
              setTimeout(() => {
                shouldInterruptRef.current = false;
              }, 500);
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
  }, [executeImmediateInterruption]);

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

    console.log('✅ Cleanup completed');
  }, [executeImmediateInterruption, stopSpeechDetection]);

  // Connect to LiveKit room for TEXT agents (simplified version of VoiceAssistant approach)
  const connectToLiveKitRoom = useCallback(async (sessionData: any) => {
    try {
      console.log('🔗 Connecting to LiveKit room for TEXT agent...');
      const room = new Room();
      roomRef.current = room;

      // Set up event listeners
      room.on(RoomEvent.Connected, async () => {
        console.log('✅ Connected to LiveKit room for TEXT agent');
        console.log('🏠 Room details:', {
          name: room.name,
          participants: room.numParticipants,
          localParticipant: room.localParticipant.identity
        });

        // Enable microphone for user input detection
        try {
          await room.localParticipant.enableCameraAndMicrophone();
          console.log('🎤 Microphone enabled for TEXT agent user input');
          
          // Start real-time speaking detection for TEXT agent
          const audioTracks = room.localParticipant.audioTrackPublications;
          if (audioTracks.size > 0) {
            const audioTrack = Array.from(audioTracks.values())[0].track;
            if (audioTrack?.mediaStream) {
              startSpeechDetection(audioTrack.mediaStream);
              console.log('🎯 Started real-time speaking detection for TEXT agent');
            }
          }
        } catch (error) {
          console.warn('⚠️ Could not enable microphone for TEXT agent:', error);
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

          // Attach audio track for playback
          const audioElement = track.attach() as HTMLAudioElement;
          audioElement.autoplay = true;
          audioElement.volume = 1.0;
          audioElement.setAttribute('data-livekit-track', 'text-agent-audio');
          
          // Enhanced logging for TEXT agent audio
          audioElement.onplay = () => {
            console.log('▶️ TEXT Agent audio started playing');
            console.log('🎵 Audio element state:', {
              volume: audioElement.volume,
              muted: audioElement.muted,
              duration: audioElement.duration,
              currentTime: audioElement.currentTime
            });
          };
          
          audioElement.onended = () => {
            console.log('🔚 TEXT Agent audio ended');
          };
          
          audioElement.onerror = (error) => {
            console.error('❌ TEXT Agent audio error:', error);
          };

          // Add to document for playback
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
  }, []);



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
      if (agentData) {
        // Use pre-fetched agent data (for public inference)
        agentInfo = agentData;
        setAgentDetails(agentInfo);
        console.log('📋 Using provided agent details:', agentInfo);
      } else {
        // Fetch agent details using authenticated API
        try {
          agentInfo = await agentAPI.getAgent(currentAgentId);
          setAgentDetails(agentInfo);
          console.log('📋 Agent details fetched:', agentInfo);
        } catch (error) {
          console.warn('Failed to fetch agent details, using default endpoint:', error);
          // Continue with default endpoint if agent fetch fails
        }
      }
      
      const agentType = agentInfo?.agent_type || agentInfo?.type || 'SPEECH';
      console.log(`📡 Agent type detected: ${agentType}`);

      // For TEXT agents, use clean LiveKit session approach (like VoiceAssistant)
      if (agentType === 'TEXT') {
        console.log('🔗 TEXT agent detected - using LiveKit session approach');
        
        // Start LiveKit session for TEXT agent (simplified - only agentId required)
        const response = await fetch(`${config.api.baseURL}/livekit/session/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            agent_id: currentAgentId,
            participant_name: `User_${Date.now()}` // Auto-generated participant name
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to start LiveKit session for TEXT agent');
        }

        const sessionData = await response.json();
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
      
      // Get microphone access with high-quality audio settings
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 48000, // High sample rate for crisp input
          sampleSize: 16, // 16-bit audio depth
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

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
            // Detect and preserve the best audio format from Hume
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
                audioStreamQueue.current.shift();
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

  }, [agentId, startSpeechDetection, addToQueue, base64ToBlob, executeImmediateInterruption, cleanup, onAudioReceived, streamAudioChunk]);



  // Stop inference

  const stopInference = useCallback(async () => {
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
    toast.success("Inference stopped");

  }, [cleanup, agentDetails, sessionData]);



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
    startInference,
    stopInference,
    toggleMic,
    sessionData, // Expose session data for TEXT agents
    mediaStream: mediaStreamRef.current,
  };

};



export default useHumeInference;


