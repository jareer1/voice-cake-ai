'use client';

import { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, Track, RemoteAudioTrack, RemoteParticipant } from 'livekit-client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from "lucide-react";
import config from "@/lib/config";
import { liveKitAPI } from "@/pages/services/api";
import { useAuth } from "@/context/authContext";
import { isAuthenticationError } from "@/utils/authUtils";

interface VoiceAssistantProps {
  apiUrl?: string;
}

interface SessionData {
  session_id: string;
  room_name: string;
  token: string;
  url: string;
  participant_identity: string;
  status: string;
}

export default function VoiceAssistant({ apiUrl }: VoiceAssistantProps) {
  const baseUrl = apiUrl || config.api.baseURL;
  const { isAuthenticated, logout } = useAuth();
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState('User');
  const [agentInstructions, setAgentInstructions] = useState('');
  const [agentStatus, setAgentStatus] = useState<string>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  
  const roomRef = useRef<Room | null>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const speakingCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Enhanced audio monitoring for speaking detection with transcription
  const setupAudioMonitoring = async () => {
    try {
      console.log('🔊 Setting up enhanced audio monitoring with transcription...');
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window.AudioContext || (window as any).webkitAudioContext)());
      console.log('🎵 Audio context created, sample rate:', audioContextRef.current.sampleRate);
      
      // Get the audio stream from LiveKit's published audio track
      if (roomRef.current && roomRef.current.localParticipant.audioTrackPublications.size > 0) {
        const audioPublication = Array.from(roomRef.current.localParticipant.audioTrackPublications.values())[0];
        const audioTrack = audioPublication.track;
        
        if (audioTrack && audioTrack.mediaStream) {
          micStreamRef.current = audioTrack.mediaStream;
          console.log('🎤 Using LiveKit audio stream for enhanced monitoring');
          
          // Create analyser
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          analyserRef.current.smoothingTimeConstant = 0.8;
          
          const source = audioContextRef.current.createMediaStreamSource(micStreamRef.current);
          source.connect(analyserRef.current);
          
          console.log('📊 Enhanced audio analyser connected to LiveKit stream');
          
          // Start monitoring audio levels
          startSpeakingDetection();
          
          // Initialize enhanced transcription for LiveKit audio stream
          initializeEnhancedTranscription(audioTrack.mediaStream);
        } else {
          console.warn('⚠️ No audio track available from LiveKit');
        }
      } else {
        console.warn('⚠️ No audio publications available from LiveKit');
      }
      
    } catch (error) {
      console.error('❌ Failed to setup enhanced audio monitoring:', error);
    }
  };

  // Initialize enhanced transcription for LiveKit audio streams
  const initializeEnhancedTranscription = (mediaStream: MediaStream) => {
    try {
      console.log('🎤 Initializing enhanced transcription for VoiceAssistant...');
      
      // Check if speech recognition is supported
      const isSpeechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      
      if (isSpeechRecognitionSupported) {
        try {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          
          // Enhanced user speech recognition for LiveKit
          const enhancedUserRecognition = new SpeechRecognition();
          enhancedUserRecognition.continuous = true;
          enhancedUserRecognition.interimResults = true;
          enhancedUserRecognition.lang = 'en-US';
          
          enhancedUserRecognition.onresult = (event) => {
            let transcript = '';
            let isFinal = false;
            let confidence = 0;
            
            for (let i = 0; i < event.results.length; i++) {
              const result = event.results[i];
              transcript += result[0].transcript;
              confidence = Math.max(confidence, result[0].confidence);
              if (result.isFinal) {
                isFinal = true;
              }
            }
            
            const cleanText = transcript.trim();
            if (cleanText) {
              console.log(`📝 VoiceAssistant enhanced transcription: ${cleanText} (final: ${isFinal}, confidence: ${(confidence * 100).toFixed(1)}%)`);
            }
          };
          
          enhancedUserRecognition.onerror = (event) => {
            console.warn('VoiceAssistant enhanced speech recognition error:', event.error);
          };
          
          enhancedUserRecognition.onend = () => {
            console.log('VoiceAssistant enhanced speech recognition ended');
          };
          
          console.log('✅ VoiceAssistant enhanced transcription initialized');
          
        } catch (error) {
          console.warn('Failed to initialize VoiceAssistant enhanced transcription:', error);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to setup VoiceAssistant enhanced transcription:', error);
    }
  };

  const startSpeakingDetection = () => {
    if (!analyserRef.current) return;
    
    console.log('🎯 Starting enhanced speaking detection...');
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    speakingCheckInterval.current = setInterval(() => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      
      // Speaking threshold (adjust as needed)
      const speakingThreshold = 20;
      const isSpeaking = average > speakingThreshold;
      
      // Log audio levels periodically
      if (Math.random() < 0.1) { // 10% chance to log
        console.log(`🔊 Audio level: ${average.toFixed(1)}, Speaking: ${isSpeaking}, Threshold: ${speakingThreshold}`);
      }
      
      // Update speaking state
      if (isSpeaking !== isUserSpeaking) {
        setIsUserSpeaking(isSpeaking);
        console.log(isSpeaking ? '🗣️ User started speaking' : '🤐 User stopped speaking');
      }
      
    }, 100); // Check every 100ms
  };

  const stopAudioMonitoring = () => {
    console.log('🛑 Stopping audio monitoring...');
    
    if (speakingCheckInterval.current) {
      clearInterval(speakingCheckInterval.current);
      speakingCheckInterval.current = null;
    }
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Microphone track stopped');
      });
      micStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      console.log('🎵 Audio context closed');
    }
    
    analyserRef.current = null;
    setIsUserSpeaking(false);
  };

    // Function to clear cached permissions (useful for testing or when permissions change)
  const clearCachedPermissions = () => {
    localStorage.removeItem('microphonePermission');
    setHasPermissions(false);
    console.log('🧹 Cached microphone permissions cleared');
  };

  const startSession = async () => {
    if (!participantName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError(null);

        try {
      console.log('🚀 Starting LiveKit session...');
      
      // Check if we have authentication token
      const authToken = localStorage.getItem('authToken');
      let sessionData: SessionData;
      
      if (authToken) {
        // Use authenticated API service with automatic token refresh
        try {
          const response = await liveKitAPI.createSession('', participantName);
          sessionData = response as SessionData;
        } catch (error: any) {
          console.error('Failed to start authenticated session:', error);
          
          // Check if it's an authentication error
          const authError = isAuthenticationError(error);
          
          if (authError) {
            console.log('🔐 Authentication error detected, logging out user');
            await logout();
            throw new Error('Your session has expired. Please log in again.');
          }
          
          throw new Error(error.response?.data?.detail || error.message || 'Failed to start session');
        }
      } else {
        // Use direct fetch for public sessions
        const response = await fetch(`${baseUrl}/livekit/session/start`, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             participant_name: participantName,
             ...(agentInstructions.trim() && { agent_instructions: agentInstructions.trim() })
           }),
         });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to start session');
        }

        sessionData = await response.json();
      }
      console.log('📋 Session created:', sessionData);
      setSessionData(sessionData);
      setAgentStatus('starting');

      // Wait a moment for agent to be ready
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Connect to the LiveKit room
      await connectToRoom(sessionData);

      // Start checking session status
      startStatusChecking(sessionData.session_id);

    } catch (error) {
      console.error('❌ Error starting session:', error);
      setError(error instanceof Error ? error.message : 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  const connectToRoom = async (sessionData: SessionData) => {
    try {
      console.log('🔗 Connecting to LiveKit room...');
      const room = new Room();
      roomRef.current = room;

      // Set up event listeners
      room.on(RoomEvent.Connected, async () => {
        console.log('✅ Connected to LiveKit room');
        console.log('🏠 Room details:', {
          name: room.name,
          participants: room.numParticipants,
          localParticipant: room.localParticipant.identity
        });
        setIsConnected(true);
        setAgentStatus('connected');
        
                          // Enable microphone only after connection (no camera needed for voice chat)
         try {
           // According to LiveKit docs, this will handle permissions and publish the audio track
           await room.localParticipant.setMicrophoneEnabled(true);
           setIsRecording(true);
           setHasPermissions(true); // Update permission status
           console.log('🎤 Microphone enabled for LiveKit (audio only)');
           
           // Setup audio monitoring for speaking detection after LiveKit has the stream
           await setupAudioMonitoring();
           
           // Log local participant details
           console.log('👤 Local participant:', {
             identity: room.localParticipant.identity,
             audioTracks: room.localParticipant.audioTrackPublications.size,
             videoTracks: room.localParticipant.videoTrackPublications.size
           });
           
         } catch (error) {
           console.error('❌ Failed to enable microphone:', error);
           setHasPermissions(false);
           setError('Failed to enable microphone');
         }
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('🔌 Disconnected from room');
        setIsConnected(false);
        setIsRecording(false);
        setAgentStatus('disconnected');
        setIsAgentSpeaking(false);
        setIsUserSpeaking(false);
        
        // Clean up audio elements
        audioElementsRef.current.forEach(audio => {
          audio.remove();
        });
        audioElementsRef.current = [];
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('👤 Participant joined:', participant.identity);
        if (participant.identity.startsWith('agent_') || participant.identity.includes('agent')) {
          setAgentStatus('ready');
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio && participant instanceof RemoteParticipant) {
          if (participant.identity.startsWith('agent_') || participant.identity.includes('agent')) {
            console.log('🎤 Agent participant detected:', participant.identity);
            
            // Agent audio - enhanced playback handling
            const audioElement = track.attach() as HTMLAudioElement;
            
            // Enhanced audio element configuration
            audioElement.autoplay = true;
            audioElement.volume = 1.0;
            audioElement.muted = false;
            audioElement.controls = false; // Hide controls but keep for debugging
            
            // Cross-browser compatibility
            if ('playsInline' in audioElement) {
              (audioElement as any).playsInline = true;
            }
            if ('webkitPlaysinline' in audioElement) {
              (audioElement as any).webkitPlaysinline = true;
            }
            
            // Force play attempt with user interaction fallback
            const attemptPlay = async () => {
              try {
                console.log('🎵 Attempting to play agent audio...');
                console.log('🔊 Audio element state:', {
                  paused: audioElement.paused,
                  muted: audioElement.muted,
                  volume: audioElement.volume,
                  readyState: audioElement.readyState,
                  networkState: audioElement.networkState,
                  src: audioElement.src || 'MediaStream',
                  srcObject: !!audioElement.srcObject
                });
                
                await audioElement.play();
                console.log('✅ Agent audio started playing successfully');
              } catch (error) {
                console.error('❌ Failed to play agent audio:', error);
                console.log('🔧 Trying alternative play methods...');
                
                // Alternative: Set volume and try again
                audioElement.volume = 0.8;
                setTimeout(async () => {
                  try {
                    await audioElement.play();
                    console.log('✅ Agent audio started on retry');
                  } catch (retryError) {
                    console.error('❌ Retry failed:', retryError);
                    
                    // Last resort: Add controls for manual play
                    audioElement.controls = true;
                    audioElement.style.position = 'fixed';
                    audioElement.style.top = '10px';
                    audioElement.style.right = '10px';
                    audioElement.style.zIndex = '9999';
                    console.log('🎛️ Added manual controls for agent audio');
                  }
                }, 500);
              }
            };
            
            // Event listeners for debugging and state tracking
            audioElement.onloadstart = () => console.log('🔄 Agent audio: Load started');
            audioElement.onloadeddata = () => console.log('📊 Agent audio: Data loaded');
            audioElement.oncanplay = () => {
              console.log('▶️ Agent audio: Can play');
              attemptPlay();
            };
            audioElement.onplay = () => {
              console.log('🎵 Agent audio: Started playing');
              setIsAgentSpeaking(true);
            };
            audioElement.onplaying = () => console.log('🎵 Agent audio: Playing');
            audioElement.onpause = () => {
              console.log('⏸️ Agent audio: Paused');
              setIsAgentSpeaking(false);
            };
            audioElement.onended = () => {
              console.log('🔚 Agent audio: Ended');
              setIsAgentSpeaking(false);
            };
            audioElement.onerror = (error) => {
              console.error('💥 Agent audio error:', error);
              setIsAgentSpeaking(false);
            };
            audioElement.onvolumechange = () => {
              console.log('🔊 Agent audio volume changed:', audioElement.volume, 'muted:', audioElement.muted);
            };
            
            // Append to document and track for cleanup
            document.body.appendChild(audioElement);
            audioElementsRef.current.push(audioElement);
            
            console.log('🎵 Agent audio track attached, attempting autoplay...');
            
            // Immediate play attempt if ready
            if (audioElement.readyState >= 2) { // HAVE_CURRENT_DATA
              attemptPlay();
            }
          }
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        track.detach();
        // Remove from our tracking array
        audioElementsRef.current = audioElementsRef.current.filter(audio => 
          !audio.srcObject || audio.srcObject !== track.mediaStream
        );
      });

      // Monitor local audio track events
      room.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
        if (publication.track?.kind === Track.Kind.Audio) {
          console.log('📤 Local audio track published to LiveKit:', {
            trackSid: publication.trackSid,
            trackName: publication.trackName,
            participant: participant.identity,
            muted: publication.isMuted,
            enabled: publication.isEnabled
          });
        }
      });

      room.on(RoomEvent.LocalTrackUnpublished, (publication, participant) => {
        if (publication.kind === Track.Kind.Audio) {
          console.log('📤❌ Local audio track unpublished from LiveKit:', {
            trackSid: publication.trackSid,
            participant: participant.identity
          });
        }
      });

      // Monitor audio transmission
      room.on(RoomEvent.TrackMuted, (publication, participant) => {
        if (publication.kind === Track.Kind.Audio && participant.isLocal) {
          console.log('🔇 Local audio track muted');
        }
      });

      room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
        if (publication.kind === Track.Kind.Audio && participant.isLocal) {
          console.log('🎤 Local audio track unmuted');
        }
      });

      // Data sending events
      room.on(RoomEvent.DataReceived, (payload, participant) => {
        console.log('📨 Data received from participant:', participant?.identity, payload);
      });

      // Connect to room
      await room.connect(sessionData.url, sessionData.token);

    } catch (error) {
      console.error('❌ Error connecting to room:', error);
      setError('Failed to connect to voice chat');
    }
  };

  const startStatusChecking = (sessionId: string) => {
    statusCheckInterval.current = setInterval(async () => {
      try {
        const response = await fetch(`${baseUrl}/livekit/session/${sessionId}/status`);
        if (response.ok) {
          const status = await response.json();
          setAgentStatus(status.status);
        }
      } catch (error) {
        console.error('❌ Error checking session status:', error);
      }
    }, 3000); // Check every 3 seconds
  };

  const toggleMute = async () => {
    if (!roomRef.current) return;

    try {
      const beforeState = {
        isMuted: roomRef.current.localParticipant.isMicrophoneEnabled,
        audioTracks: roomRef.current.localParticipant.audioTrackPublications.size,
        publications: Array.from(roomRef.current.localParticipant.audioTrackPublications.values()).map(pub => ({
          trackSid: pub.trackSid,
          isMuted: pub.isMuted,
          isEnabled: pub.isEnabled
        }))
      };
      
      console.log('🎛️ Before toggle - Audio state:', beforeState);

      if (isMuted) {
        await roomRef.current.localParticipant.setMicrophoneEnabled(true);
        setIsMuted(false);
        console.log('🎤 Microphone unmuted via LiveKit API');
      } else {
        await roomRef.current.localParticipant.setMicrophoneEnabled(false);
        setIsMuted(true);
        console.log('🔇 Microphone muted via LiveKit API');
      }

      // Log state after toggle
      setTimeout(() => {
        const afterState = {
          isMuted: roomRef.current?.localParticipant.isMicrophoneEnabled,
          audioTracks: roomRef.current?.localParticipant.audioTrackPublications.size,
          publications: Array.from(roomRef.current?.localParticipant.audioTrackPublications.values() || []).map(pub => ({
            trackSid: pub.trackSid,
            isMuted: pub.isMuted,
            isEnabled: pub.isEnabled
          }))
        };
        console.log('🎛️ After toggle - Audio state:', afterState);
      }, 100);

    } catch (error) {
      console.error('❌ Error toggling microphone:', error);
      setError('Failed to toggle microphone');
    }
  };

  const startRecording = async () => {
    if (!roomRef.current) return;

    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(true);
      setIsRecording(true);
      setIsMuted(false);
      console.log('🎤 Microphone enabled');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      setError('Failed to access microphone');
    }
  };

  const stopRecording = async () => {
    if (!roomRef.current) return;

    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(false);
      setIsRecording(false);
      setIsMuted(true);
      console.log('🔇 Microphone disabled');
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
    }
  };

  const endSession = async () => {
    console.log('🛑 Ending session...');
    
    // Stop status checking
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }

    // Stop audio monitoring
    stopAudioMonitoring();

    // Clean up audio elements with detailed logging
    console.log('🧹 Cleaning up audio elements:', audioElementsRef.current.length);
    audioElementsRef.current.forEach((audio, index) => {
      console.log(`🔇 Cleaning audio element ${index}:`, {
        paused: audio.paused,
        volume: audio.volume,
        srcObject: !!audio.srcObject,
        parentNode: !!audio.parentNode
      });
      
      try {
        audio.pause();
        audio.srcObject = null;
        if (audio.parentNode) {
          audio.parentNode.removeChild(audio);
        }
      } catch (error) {
        console.error(`❌ Error cleaning audio element ${index}:`, error);
      }
    });
    audioElementsRef.current = [];

    // Disconnect from room with logging
    if (roomRef.current) {
      console.log('🔌 Disconnecting from LiveKit room...');
      console.log('📊 Final room state:', {
        participants: roomRef.current.numParticipants,
        localTracks: roomRef.current.localParticipant.audioTrackPublications.size
      });
      
      roomRef.current.disconnect();
      roomRef.current = null;
      console.log('✅ Disconnected from LiveKit room');
    }

    // Stop the session on the server
    if (sessionData) {
      try {
        await fetch(`${baseUrl}/livekit/session/${sessionData.session_id}`, {
          method: 'DELETE',
        });
        console.log('✅ Session ended successfully on server');
      } catch (error) {
        console.error('❌ Error stopping session on server:', error);
      }
    }

    // Reset state
    setSessionData(null);
    setIsConnected(false);
    setIsRecording(false);
    setIsMuted(false);
    setIsUserSpeaking(false);
    setIsAgentSpeaking(false);
    setAgentStatus('idle');
    setError(null);
    
    console.log('🧹 Session cleanup completed');
  };

  // Manual audio test function
  const testAudioPlayback = () => {
    console.log('🔧 Testing audio playback...');
    console.log('📊 Current audio elements:', audioElementsRef.current.length);
    
    audioElementsRef.current.forEach((audio, index) => {
      console.log(`🎵 Audio element ${index}:`, {
        paused: audio.paused,
        muted: audio.muted,
        volume: audio.volume,
        readyState: audio.readyState,
        networkState: audio.networkState,
        srcObject: !!audio.srcObject,
        currentTime: audio.currentTime,
        duration: audio.duration
      });
      
      // Try to play manually
      audio.play().then(() => {
        console.log(`✅ Audio element ${index} started playing`);
      }).catch(error => {
        console.error(`❌ Audio element ${index} failed to play:`, error);
      });
    });
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'secondary';
      case 'starting': return 'default';
      case 'connecting': return 'default';
      case 'connected': return 'default';
      case 'ready': return 'default';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'idle': return '⚪';
      case 'starting': return '🟡';
      case 'connecting': return '🔵';
      case 'connected': return '🟢';
      case 'ready': return '✅';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up...');
      
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      
      // Stop audio monitoring
      stopAudioMonitoring();
      
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      
      console.log('✅ Component cleanup completed');
    };
  }, []);

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Phone className="w-6 h-6" />
          LiveKit Voice Assistant
        </CardTitle>
      </CardHeader>
      
             <CardContent className="space-y-4">
         {/* Setup Form */}
         {!sessionData && (
           <div className="space-y-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Your Name:</label>
               <Input
                 type="text"
                 value={participantName}
                 onChange={(e) => setParticipantName(e.target.value)}
                 placeholder="Enter your name"
                 disabled={isLoading}
               />
             </div>
             
             <div className="space-y-2">
               <label className="text-sm font-medium">Agent Instructions (Optional):</label>
               <Input
                 type="text"
                 value={agentInstructions}
                 onChange={(e) => setAgentInstructions(e.target.value)}
                 placeholder="Custom instructions for the AI assistant"
                 disabled={isLoading}
               />
             </div>
           </div>
         )}

         {/* Status Display */}
         <div className="text-center space-y-2">
           <Badge variant={getStatusColor(agentStatus)} className="text-sm">
             {getStatusEmoji(agentStatus)} Agent Status: {agentStatus}
           </Badge>
           
           {/* Speaking Indicators */}
           <div className="flex justify-center gap-2 flex-wrap">
             {isRecording && !isMuted && (
               <Badge variant="default" className="animate-pulse">
                 🎤 Listening...
               </Badge>
             )}
             {isMuted && (
               <Badge variant="secondary">
                 🔇 Muted
               </Badge>
             )}
             {isUserSpeaking && !isMuted && (
               <Badge variant="default" className="animate-pulse bg-green-600">
                 🗣️ You're Speaking
               </Badge>
             )}
             {isAgentSpeaking && (
               <Badge variant="default" className="animate-pulse bg-blue-600">
                 🎵 Agent Speaking...
               </Badge>
             )}
           </div>
           
                       {/* Permissions Status */}
            <Badge variant="outline" className={`text-xs ${hasPermissions ? 'border-green-500 text-green-700' : 'border-yellow-500 text-yellow-700'}`}>
              {hasPermissions ? '✅ Microphone Access Granted' : '⚠️ Microphone Permission Will Be Requested'}
            </Badge>
         </div>

        {/* Error Display */}
        {error && (
          <Alert className="border-destructive">
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

                 {/* Action Buttons */}
         <div className="space-y-3">
           {!sessionData ? (
             <Button
               onClick={startSession}
               disabled={isLoading || !participantName.trim()}
               className="w-full"
               size="lg"
             >
               {isLoading ? '🔄 Starting Assistant...' : '🚀 Start Voice Chat'}
             </Button>
           ) : (
             <>
               {/* Audio Controls */}
               <div className="grid grid-cols-2 gap-2">
                 <Button
                   onClick={toggleMute}
                   disabled={!isConnected}
                   variant={isMuted ? "destructive" : "default"}
                   className="flex-1"
                 >
                   {isMuted ? (
                     <>
                       <MicOff className="w-4 h-4 mr-2" />
                       Unmute
                     </>
                   ) : (
                     <>
                       <Mic className="w-4 h-4 mr-2" />
                       Mute
                     </>
                   )}
                 </Button>
                 
                 <Button
                   onClick={endSession}
                   variant="outline"
                   className="flex-1"
                 >
                   <PhoneOff className="w-4 h-4 mr-2" />
                   End Call
                 </Button>
               </div>
               
               {/* Connection Status */}
               <div className="text-center text-sm text-muted-foreground">
                 {isConnected ? (
                   agentStatus === 'ready' ? (
                     <span className="text-green-600">🟢 Connected - Ready to chat!</span>
                   ) : (
                     <span className="text-yellow-600">🟡 Connected - Agent starting...</span>
                   )
                 ) : (
                   <span className="text-red-600">🔴 Disconnected</span>
                 )}
               </div>
               
               {/* Debug Controls */}
               <div className="text-center space-y-2">
                 {sessionData && audioElementsRef.current.length > 0 && (
                   <Button
                     onClick={testAudioPlayback}
                     variant="outline"
                     size="sm"
                     className="text-xs"
                   >
                     🔧 Test Audio Playback
                   </Button>
                 )}
                 <Button
                   onClick={clearCachedPermissions}
                   variant="outline"
                   size="sm"
                   className="text-xs"
                 >
                   🧹 Clear Permissions Cache
                 </Button>
               </div>
             </>
           )}
         </div>

        {/* Session Info */}
        {sessionData && (
          <Card className="bg-muted">
            <CardContent className="p-3 text-xs space-y-1">
              <p><strong>Session:</strong> {sessionData.session_id.slice(0, 8)}...</p>
              <p><strong>Room:</strong> {sessionData.room_name}</p>
              <p><strong>Identity:</strong> {sessionData.participant_identity}</p>
              <p><strong>Audio Elements:</strong> {audioElementsRef.current.length} active</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
