import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import config from "@/lib/config";

export const INFERENCE_STATES = {
  IDLE: "idle",
  CONNECTING: "connecting",
  ACTIVE: "active",
  ERROR: "error",
} as const;

interface UseHumeInferenceProps {
  agentId?: string;
  onAudioReceived?: (audioBlob: Blob) => void;
}

const useHumeInference = ({ 
  agentId, 
  onAudioReceived
}: UseHumeInferenceProps = {}) => {
  const [inferenceState, setInferenceState] = useState<keyof typeof INFERENCE_STATES>("IDLE");
  const [isLoading, setIsLoading] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  // WebSocket and Media Stream refs
  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // Audio Management
  const audioQueueRef = useRef<{ url: string; type: string; blob: Blob; mimeType: string }[]>([]);
  const isPlayingRef = useRef(false);
  const urlsToCleanupRef = useRef(new Set<string>());
  const shouldInterruptRef = useRef(false);
  
  // Real-time audio streaming for small chunks
  const audioStreamQueue = useRef<{ blob: Blob; mimeType: string }[]>([]);
  const isStreamingRef = useRef(false);
  const nextPlayTimeRef = useRef(0); // Precise timing for seamless transitions
  
  // Audio Context for high-quality playback
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // Speech Detection
  const isUserSpeakingRef = useRef(false);
  const speechContextRef = useRef<AudioContext | null>(null);
  const speechFramesRef = useRef(0);
  const silenceFramesRef = useRef(0);

  // Initialize high-quality audio context with low latency
  const initializeAudioContext = useCallback(async () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 48000,
        latencyHint: 'interactive'
      });
      
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
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
    
    // Clean up URLs
    urlsToCleanupRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('Error revoking URL:', error);
      }
    });
    urlsToCleanupRef.current.clear();
    
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
      const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
      
      console.log(`🎵 High-quality audio: duration=${audioBuffer.duration}s, sampleRate=${audioBuffer.sampleRate}Hz`);
      
      if (shouldInterruptRef.current) {
        console.log('🚫 Interruption detected after decoding, aborting playback');
        return false;
      }
      
      const source = audioContextRef.current!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current!);
      
      source.playbackRate.value = 1.0;
      gainNodeRef.current!.gain.value = 1.0;
      
      currentAudioSourceRef.current = source;
      
      source.onended = () => {
        console.log('🔚 High-quality audio ended');
        currentAudioSourceRef.current = null;
        isPlayingRef.current = false;
        shouldInterruptRef.current = false;
        setTimeout(playNext, 25);
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

  // Queue processing
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
      const response = await fetch(item.url);
      
      if (shouldInterruptRef.current) {
        console.log('🚫 Interruption detected after fetch, aborting');
        isPlayingRef.current = false;
        return;
      }
      
      const audioBlob = await response.blob();
      const properBlob = new Blob([audioBlob], { 
        type: item.mimeType || 'audio/wav' 
      });
      
      await playAudioWithHighQuality(properBlob);
    } catch (error) {
      console.warn('Enhanced audio failed:', error);
      isPlayingRef.current = false;
      shouldInterruptRef.current = false;
      setTimeout(playNext, 25);
    }
  }, [playAudioWithHighQuality]);

  // Add audio to queue
  const addToQueue = useCallback((audioBlob: Blob, type = 'audio', mimeType = 'audio/wav') => {
    if (shouldInterruptRef.current) {
      console.log('🚫 Skipping queue addition due to interruption');
      return;
    }
    
    console.log(`🎵 Adding to queue: type=${type}, size=${audioBlob.size} bytes, mime=${mimeType}`);
    
    const url = URL.createObjectURL(audioBlob);
    urlsToCleanupRef.current.add(url);
    
    audioQueueRef.current.push({ url, type, blob: audioBlob, mimeType });
    
    if (!isPlayingRef.current) {
      playNext();
    }
  }, [playNext]);

  // Enhanced speech detection with better sensitivity and low latency
  const startSpeechDetection = useCallback((stream: MediaStream) => {
    try {
      if (!speechContextRef.current || speechContextRef.current.state === 'closed') {
        speechContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 48000,
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
        
        // Enhanced speech detection threshold - increased sensitivity to avoid background noise
        if (rms > 30 && !isUserSpeakingRef.current) { // Increased threshold to avoid background noise
          speechFramesRef.current++;
          silenceFramesRef.current = 0;
          
          // Require 5 consecutive speech frames to confirm speaking (more reliable detection)
          if (speechFramesRef.current >= 5) {
            isUserSpeakingRef.current = true;
            console.log('🎤 User started speaking - IMMEDIATE interruption');
            executeImmediateInterruption();
          }
        } else if (rms < 15 && isUserSpeakingRef.current) { // Increased threshold for silence detection
          silenceFramesRef.current++;
          speechFramesRef.current = 0;
          
          // Require 8 consecutive silence frames to confirm stopped speaking
          if (silenceFramesRef.current >= 8) {
            isUserSpeakingRef.current = false;
            console.log('🤫 User stopped speaking');
            // Reset interruption flag after a short delay
            setTimeout(() => {
              shouldInterruptRef.current = false;
            }, 500);
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

  // Base64 to Blob conversion
  const base64ToBlob = useCallback((base64: string, mime = 'audio/wav'): Blob | null => {
    try {
      const base64Data = base64.replace(/^data:audio\/[^;]+;base64,/, '');
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mime });
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
      
      // Decode the audio immediately
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
      
      console.log(`🎵 Real-time chunk: duration=${audioBuffer.duration.toFixed(3)}s, size=${audioBlob.size} bytes`);
      
      // Check for interruption after decoding
      if (shouldInterruptRef.current) {
        console.log('🚫 Interruption detected after decoding, aborting playback');
        return;
      }
      
      // Initialize next play time if this is the first chunk
      if (nextPlayTimeRef.current === 0) {
        nextPlayTimeRef.current = audioContextRef.current!.currentTime + 0.05; // 50ms buffer
        console.log(`⏰ Started real-time stream at ${nextPlayTimeRef.current.toFixed(3)}s`);
      }
      
      // Create buffer source
      const source = audioContextRef.current!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current!);
      
      // Schedule for immediate playback
      source.start(nextPlayTimeRef.current);
      console.log(`▶️ Scheduled chunk at ${nextPlayTimeRef.current.toFixed(3)}s (duration: ${audioBuffer.duration.toFixed(3)}s)`);
      
      // Update next play time for seamless transition
      nextPlayTimeRef.current += audioBuffer.duration;
      
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
    
    // Close WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
    
    // Reset flags
    shouldInterruptRef.current = false;
    isPlayingRef.current = false;
    isUserSpeakingRef.current = false;
    
    console.log('✅ Cleanup completed');
  }, [executeImmediateInterruption, stopSpeechDetection]);

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
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      mediaStreamRef.current = stream;

      // Start speech detection
      startSpeechDetection(stream);

      // Create WebSocket connection
      const wsUrl = config.getHumeWebSocketUrl(currentAgentId);
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

          // Handle audio chunks with real-time streaming
          if (data.audio) {
            const audioFormat = data.audio_format || 'audio/wav';
            console.log('📡 Received Audio Data:', {
              dataLength: data.audio.length,
              audioFormat: audioFormat,
              chunksCombined: data.chunks_combined,
              totalSize: data.total_size,
              segmentType: data.segment_type,
              hasAudio: !!data.audio
            });
            
            const audioBlob = base64ToBlob(data.audio, audioFormat);
            if (audioBlob) {
              // For real-time streaming, play immediately or queue for seamless transition
              if (nextPlayTimeRef.current === 0) {
                // First chunk - start streaming immediately
                streamAudioChunk(audioBlob, audioFormat);
              } else {
                // Subsequent chunks - add to stream queue for seamless playback
                audioStreamQueue.current.push({ blob: audioBlob, mimeType: audioFormat });
                console.log(`📦 Queued chunk for streaming, queue size: ${audioStreamQueue.current.length}`);
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

      // Set up media recorder with 50ms latency for better real-time performance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000
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

      mediaRecorder.start(50); // 50ms chunks for lower latency and better real-time performance
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
  const stopInference = useCallback(() => {
    cleanup();
    setInferenceState("IDLE");
    setIsLoading(false);
    setIsMicOn(true);
    setIsConnected(false);
    toast.success("Inference stopped");
  }, [cleanup]);

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
    mediaStream: mediaStreamRef.current,
  };
};

export default useHumeInference;
