(function() {
  'use strict';
  
  // Load LiveKit client library if not already loaded
  function loadLiveKitClient() {
    return new Promise((resolve, reject) => {
      // Check if already loaded (try both case variations)
      if (window.LiveKitClient || window.LivekitClient) {
        console.log('VoiceCake: LiveKit client library already loaded');
        resolve();
        return;
      }
      
      // Check if already loading
      const existingScript = document.querySelector('script[src*="livekit-client"]');
      if (existingScript) {
        console.log('VoiceCake: LiveKit client library already loading, waiting...');
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.LiveKitClient || window.LivekitClient) {
            clearInterval(checkInterval);
            console.log('VoiceCake: LiveKit client library loaded from existing script');
            resolve();
          } else if (attempts > 50) {
            clearInterval(checkInterval);
            reject(new Error('VoiceCake: LiveKit client library not available after script load'));
          }
        }, 100);
        return;
      }
      
      // Load LiveKit client library with multiple fallback sources
      console.log('VoiceCake: Loading LiveKit client library...');
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/livekit-client@2.15.5/dist/livekit-client.umd.js';
      
      script.onload = function() {
        console.log('VoiceCake: LiveKit client library loaded from unpkg');
        // Wait a bit for the library to initialize
        setTimeout(() => {
          if (window.LiveKitClient || window.LivekitClient) {
            resolve();
          } else {
            reject(new Error('VoiceCake: LiveKit client library not available after load'));
          }
        }, 500);
      };
      
      script.onerror = function() {
        console.log('VoiceCake: Failed to load from unpkg, trying jsDelivr...');
        // Fallback to jsDelivr
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://cdn.jsdelivr.net/npm/livekit-client@2.15.5/dist/livekit-client.umd.js';
        
        fallbackScript.onload = function() {
          console.log('VoiceCake: LiveKit client library loaded from jsDelivr');
          setTimeout(() => {
            if (window.LiveKitClient || window.LivekitClient) {
              resolve();
            } else {
              reject(new Error('VoiceCake: LiveKit client library not available after fallback load'));
            }
          }, 500);
        };
        
        fallbackScript.onerror = function() {
          reject(new Error('VoiceCake: Failed to load LiveKit client library from all sources'));
        };
        
        document.head.appendChild(fallbackScript);
      };
      
      document.head.appendChild(script);
    });
  }
  
  const VoiceCakeWidget = {
    config: {
      agentId: null,
      position: 'bottom-left',
      theme: 'light',
      size: 'medium',
      autoStart: false,
      showTranscription: true,
      apiBaseUrl: 'https://voicecakedevelop-hrfygverfwe8g4bj.canadacentral-01.azurewebsites.net/api/v1',
      wsBaseUrl: 'ws://voicecakedevelop-hrfygverfwe8g4bj.canadacentral-01.azurewebsites.net',
      humeEndpoint: '/api/v1/hume/ws/inference'
    },
    
    state: {
      isInitialized: false,
      isConnected: false,
      isActive: false,
      isConnecting: false,
      isMicOn: true,
      hasPermissions: false
    },
    
    elements: {},
    refs: {
      socket: null,
      mediaStream: null,
      mediaRecorder: null,
      audioContext: null,
      audioQueue: [],
      isPlaying: false,
      callTimer: null,
      callStartTime: null,
      liveKitRoom: null
    },
    
    init: function(customConfig = {}) {
      console.log('VoiceCake Widget: Initializing with config:', customConfig);
      
      if (this.state.isInitialized) {
        console.log('VoiceCake Widget: Already initialized');
        return;
      }
      
      this.config = { ...this.config, ...customConfig };
      
      if (!this.config.agentId) {
        console.error('VoiceCake Widget: agentId is required');
        return;
      }
      
      console.log('VoiceCake Widget: Creating widget elements...');
      this.createWidget();
      
      // Check if widget was created successfully
      if (!this.elements.container) {
        console.error('VoiceCake Widget: Failed to create widget elements');
        return;
      }
      
      this.attachEventListeners();
      this.state.isInitialized = true;
      console.log('VoiceCake Widget: Initialization complete');
    },
    
    createWidget: function() {
      console.log('VoiceCake Widget: Creating widget elements...');
      
      // Ensure document.body exists
      if (!document.body) {
        console.error('VoiceCake Widget: document.body not available');
        return;
      }
      
      const container = document.createElement('div');
      container.id = 'voicecake-widget-container';
      container.className = `voicecake-widget voicecake-${this.config.theme} voicecake-${this.config.size} voicecake-${this.config.position}`;
      
      const button = document.createElement('button');
      button.id = 'voicecake-widget-button';
      button.className = 'voicecake-widget-button';
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" x2="12" y1="19" y2="22"></line>
        </svg>
      `;
      
      const popup = document.createElement('div');
      popup.id = 'voicecake-widget-popup';
      popup.className = 'voicecake-widget-popup';
      popup.innerHTML = `
        <div class="voicecake-widget-header">
          <div class="voicecake-widget-title">
            <div class="voicecake-status-indicator">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
            </div>
            <div class="voicecake-widget-title-text">
              <h3>AI Voice Agent</h3>
              <p>Available 24/7</p>
            </div>
          </div>
          <button class="voicecake-widget-close" id="voicecake-widget-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>
        <div class="voicecake-widget-content">
          <div class="text-center mb-4">
            <div class="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-accent">
                <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path>
              </svg>
            </div>
            <h4 class="font-semibold text-foreground mb-2">Talk to Our Agent</h4>
            <p class="text-sm text-muted-foreground mb-4">Experience our advanced AI voice agent with real-time conversation capabilities.</p>
          </div>
          <div class="voicecake-widget-controls">
            <button class="voicecake-btn voicecake-btn-primary" id="voicecake-start-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
              <span>Start Voice Chat</span>
            </button>
            <button class="voicecake-btn voicecake-btn-secondary" id="voicecake-stop-btn" style="display: none;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="6" y="6" width="12" height="12"></rect>
              </svg>
              <span>End Call</span>
            </button>
            <button class="voicecake-btn voicecake-btn-mic" id="voicecake-mic-btn" style="display: none;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
            </button>
          </div>
          
          <!-- Audio Wave Visualization -->
          <div class="voicecake-audio-wave" id="voicecake-audio-wave" style="display: none;">
            <div class="voicecake-wave-container">
              <div class="voicecake-wave-label">Voice Activity</div>
              <div class="voicecake-wave-bars">
                <div class="voicecake-wave-bar"></div>
                <div class="voicecake-wave-bar"></div>
                <div class="voicecake-wave-bar"></div>
                <div class="voicecake-wave-bar"></div>
                <div class="voicecake-wave-bar"></div>
                <div class="voicecake-wave-bar"></div>
                <div class="voicecake-wave-bar"></div>
                <div class="voicecake-wave-bar"></div>
              </div>
            </div>
          </div>
          <div class="voicecake-call-timer" id="voicecake-call-timer" style="display: none;">
            <div class="voicecake-timer-display">
              <span id="voicecake-timer-text">0:00</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-border">
            <div class="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Agent is online and ready</span>
            </div>
          </div>
        </div>
        <div class="voicecake-widget-loading" id="voicecake-loading" style="display: none;">
          <div class="voicecake-spinner"></div>
          <span>Connecting...</span>
        </div>
      `;
      
      container.appendChild(button);
      container.appendChild(popup);
      document.body.appendChild(container);
      
      this.elements = {
        container,
        button,
        popup,
        closeButton: document.getElementById('voicecake-widget-close'),
        startButton: document.getElementById('voicecake-start-btn'),
        stopButton: document.getElementById('voicecake-stop-btn'),
        micButton: document.getElementById('voicecake-mic-btn'),
        statusIndicator: document.querySelector('.voicecake-status-indicator'),
        loadingSpinner: document.getElementById('voicecake-loading'),
        callTimer: document.getElementById('voicecake-call-timer'),
        timerText: document.getElementById('voicecake-timer-text'),
        audioWave: document.getElementById('voicecake-audio-wave'),
        waveBars: document.querySelectorAll('#voicecake-audio-wave .voicecake-wave-bar')
      };
      
            console.log('VoiceCake Widget: Widget elements created and attached to DOM');
    },
    
    attachEventListeners: function() {
      this.elements.button.addEventListener('click', () => this.togglePopup());
      this.elements.closeButton.addEventListener('click', () => this.closePopup());
      
      // Add document click listener to close popup when clicking outside
      this.refs.documentClickListener = (event) => {
        if (this.isPopupOpen() && 
            !this.elements.container.contains(event.target)) {
          this.closePopup();
        }
      };
      document.addEventListener('click', this.refs.documentClickListener);
      
      this.elements.startButton.addEventListener('click', () => this.startInference());
      this.elements.stopButton.addEventListener('click', () => this.stopInference());
      this.elements.micButton.addEventListener('click', () => this.toggleMic());
    },
    
    togglePopup: function() {
      if (this.isPopupOpen()) {
        this.closePopup();
      } else {
        this.openPopup();
      }
    },
    
    openPopup: function() {
      this.elements.popup.classList.add('voicecake-active');
    },
    
    closePopup: function() {
      this.elements.popup.classList.remove('voicecake-active');
    },
    
    isPopupOpen: function() {
      return this.elements.popup.classList.contains('voicecake-active');
    },
    
    startInference: async function() {
      if (this.state.isConnecting || this.state.isActive) return;
      
      try {
        this.setState('CONNECTING');
        this.showLoading(true);
        
        // First, get agent details to determine the type
        let agentDetails = null;
        try {
          const response = await fetch(`${this.config.apiBaseUrl}/agents/${this.config.agentId}/public`);
          agentDetails = await response.json();
          console.log('Agent details:', agentDetails);
        } catch (error) {
          console.error('Failed to fetch agent details:', error);
          // Try regular endpoint as fallback
          try {
            const response = await fetch(`${this.config.apiBaseUrl}/agents/${this.config.agentId}`);
            agentDetails = await response.json();
          } catch (fallbackError) {
            console.error('Failed to fetch agent details from fallback endpoint:', fallbackError);
            throw new Error('Failed to fetch agent details');
          }
        }
        
        const agentType = (agentDetails?.agent_type || agentDetails?.type || 'SPEECH')?.toString()?.trim();
        console.log('Agent type detected:', agentType);
        
        // For TEXT agents, use LiveKit session approach
        if (agentType?.toUpperCase() === 'TEXT') {
          console.log('Using LiveKit session for TEXT agent');
          
          // Get microphone permission
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              sampleRate: 48000,
              echoCancellation: true,
              noiseSuppression: true
            }
          });
          
          this.refs.mediaStream = stream;
          this.state.hasPermissions = true;
          
          // Create LiveKit session
          const sessionResponse = await fetch(`${this.config.apiBaseUrl}/livekit/session/start/public`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              agent_id: this.config.agentId,
              participant_name: `PublicUser_${Date.now()}`
            })
          });
          
          if (!sessionResponse.ok) {
            throw new Error('Failed to create LiveKit session');
          }
          
          const sessionData = await sessionResponse.json();
          console.log('LiveKit session created:', sessionData);
          
          // Connect to LiveKit room
          await this.connectToLiveKitRoom(sessionData);
          
          this.setState('ACTIVE');
          this.showLoading(false);
          this.updateUI();
          this.startCallTimer();
          this.showAudioWave();
          
          // Show a message that TEXT agents are supported
          this.updateStatusMessage('TEXT agent connected successfully!');
          
        } else {
          // For SPEECH agents, use WebSocket approach
          console.log('Using WebSocket for SPEECH agent');
          
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              sampleRate: 48000,
              echoCancellation: true,
              noiseSuppression: true
            }
          });
          
          this.refs.mediaStream = stream;
          this.state.hasPermissions = true;
          
          const wsUrl = `${this.config.wsBaseUrl}${this.config.humeEndpoint}/${this.config.agentId}`;
          this.refs.socket = new WebSocket(wsUrl);
          
          await new Promise((resolve, reject) => {
            this.refs.socket.onopen = () => {
              this.state.isConnected = true;
              resolve();
            };
            this.refs.socket.onerror = reject;
          });
          
          this.refs.socket.onmessage = async (event) => {
            if (event.data instanceof Blob) {
              this.addToAudioQueue(event.data);
              return;
            }
            
            try {
              const data = JSON.parse(event.data);
              if (data.audio) {
                const audioBlob = this.base64ToBlob(data.audio, data.audio_format || 'audio/wav');
                if (audioBlob) {
                  this.addToAudioQueue(audioBlob);
                }
              }
            } catch (error) {
              console.error('Error processing message:', error);
            }
          };
          
          this.refs.socket.onclose = () => {
            this.state.isConnected = false;
            this.stopInference();
          };
          
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: "audio/webm;codecs=opus"
          });
          
          this.refs.mediaRecorder = mediaRecorder;
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && this.refs.socket.readyState === WebSocket.OPEN) {
              this.refs.socket.send(event.data);
              
              // Simple user speaking detection based on audio data size
              if (event.data.size > 1000) { // Threshold for speaking
                this.startAudioWave();
                // Stop wave after a short delay
                setTimeout(() => {
                  this.stopAudioWave();
                }, 200);
              }
            }
          };
          
          mediaRecorder.start(100);
          
          this.setState('ACTIVE');
          this.showLoading(false);
          this.updateUI();
          this.startCallTimer();
          this.showAudioWave();
        }
        
      } catch (error) {
        console.error('Error starting inference:', error);
        this.setState('ERROR');
        this.showLoading(false);
        this.cleanup();
      }
    },
    
    stopInference: function() {
      this.stopCallTimer();
      this.cleanup();
      this.setState('IDLE');
      this.updateUI();
    },
    
    toggleMic: function() {
      if (this.refs.mediaStream) {
        this.refs.mediaStream.getAudioTracks().forEach((track) => {
          track.enabled = !track.enabled;
          this.state.isMicOn = track.enabled;
        });
        this.updateUI();
      }
    },
    
    setState: function(state) {
      this.state.isConnecting = state === 'CONNECTING';
      this.state.isActive = state === 'ACTIVE';
      this.updateStatus(state);
    },
    
    updateStatus: function(state) {
      // Update the status text in the title area
      const titleText = document.querySelector('.voicecake-widget-title-text p');
      if (titleText) {
        const statusMap = {
          'IDLE': 'Available 24/7',
          'CONNECTING': 'Connecting...',
          'ACTIVE': 'Connected - Speak now',
          'ERROR': 'Connection error'
        };
        titleText.textContent = statusMap[state] || statusMap['IDLE'];
      }
      
      // Update the status indicator color
      const statusIndicator = document.querySelector('.voicecake-status-indicator');
      if (statusIndicator) {
        const statusClassMap = {
          'IDLE': 'voicecake-idle',
          'CONNECTING': 'voicecake-connecting',
          'ACTIVE': 'voicecake-active',
          'ERROR': 'voicecake-error'
        };
        
        // Remove existing status classes
        statusIndicator.classList.remove('voicecake-idle', 'voicecake-connecting', 'voicecake-active', 'voicecake-error');
        
        // Add new status class
        const newClass = statusClassMap[state] || statusClassMap['IDLE'];
        statusIndicator.classList.add(newClass);
      }
    },
    
    // Method to update status with custom message
    updateStatusMessage: function(message) {
      const titleText = document.querySelector('.voicecake-widget-title-text p');
      if (titleText) {
        titleText.textContent = message;
      }
    },
    
    // Start call timer
    startCallTimer: function() {
      this.refs.callStartTime = Date.now();
      this.refs.callTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.refs.callStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (this.elements.timerText) {
          this.elements.timerText.textContent = timerText;
        }
      }, 1000);
      
      // Show timer
      if (this.elements.callTimer) {
        this.elements.callTimer.style.display = 'block';
      }
    },
    
    // Stop call timer
    stopCallTimer: function() {
      if (this.refs.callTimer) {
        clearInterval(this.refs.callTimer);
        this.refs.callTimer = null;
        this.refs.callStartTime = null;
      }
      
      // Hide timer
      if (this.elements.callTimer) {
        this.elements.callTimer.style.display = 'none';
      }
      
      // Reset timer text
      if (this.elements.timerText) {
        this.elements.timerText.textContent = '0:00';
      }
    },
    
    // Connect to LiveKit room for TEXT agents
    connectToLiveKitRoom: async function(sessionData) {
      try {
        console.log('🔗 Connecting to LiveKit room for TEXT agent...');
        
        // Ensure LiveKit client is loaded
        await loadLiveKitClient();
        
        // Small delay to ensure library is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get the correct LiveKit client (handle both case variations)
        const LiveKitClient = window.LiveKitClient || window.LivekitClient;
        
        console.log('LiveKit client check:', {
          LiveKitClient: !!LiveKitClient,
          Room: !!LiveKitClient?.Room,
          RoomEvent: !!LiveKitClient?.RoomEvent,
          Track: !!LiveKitClient?.Track
        });
        
        if (!LiveKitClient) {
          throw new Error('LiveKit client library not loaded');
        }
        
        const { Room, RoomEvent, Track } = LiveKitClient || {};
        
        if (!Room || !RoomEvent || !Track) {
          throw new Error('LiveKit client library not properly loaded - missing required classes');
        }
        const room = new Room();
        this.refs.liveKitRoom = room;
        
        // Set up event listeners
        room.on(RoomEvent.Connected, async () => {
          console.log('✅ Connected to LiveKit room for TEXT agent');
          this.state.isConnected = true;
          
          try {
            await room.localParticipant.setMicrophoneEnabled(true);
            console.log('🎤 Microphone enabled for TEXT agent');
          } catch (error) {
            console.error('❌ Failed to enable microphone:', error);
          }
        });
        
        room.on(RoomEvent.Disconnected, () => {
          console.log('🔌 Disconnected from LiveKit room');
          this.state.isConnected = false;
        });
        
        room.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log('👤 Participant joined:', participant.identity);
          if (participant.identity.includes('agent')) {
            console.log('🤖 TEXT Agent participant detected:', participant.identity);
          }
        });
        
        // Handle audio tracks from agent (TEXT-to-Speech output)
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === Track.Kind.Audio && participant.identity.includes('agent')) {
            console.log('🎵 TEXT Agent audio track received:', {
              participantId: participant.identity,
              trackSid: publication.trackSid
            });
            
            // Create audio element for playback
            const audioElement = track.attach();
            audioElement.autoplay = true;
            audioElement.volume = 1.0;
            audioElement.setAttribute('data-livekit-track', 'text-agent-audio');
            
            audioElement.onplay = () => {
              console.log('▶️ TEXT Agent audio started playing');
              this.startAudioWave();
            };
            
            audioElement.onended = () => {
              console.log('🔚 TEXT Agent audio ended');
              this.stopAudioWave();
            };
            
            audioElement.onerror = (error) => {
              console.error('❌ TEXT Agent audio error:', error);
            };
            
            // Add to DOM for playback
            document.body.appendChild(audioElement);
            console.log('🔊 TEXT Agent audio element attached to DOM');
          }
        });
        
        // Connect to room
        await room.connect(sessionData.url, sessionData.token);
        console.log('✅ Successfully connected to LiveKit room for TEXT agent');
        
      } catch (error) {
        console.error('❌ Error connecting to LiveKit room:', error);
        throw error;
      }
    },
    
    updateUI: function() {
      const startBtn = this.elements.startButton;
      const stopBtn = this.elements.stopButton;
      const micBtn = this.elements.micButton;
      
      if (this.state.isActive) {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'flex';
        micBtn.style.display = 'flex';
      } else {
        startBtn.style.display = 'flex';
        stopBtn.style.display = 'none';
        micBtn.style.display = 'none';
      }
      
      if (this.state.isMicOn) {
        micBtn.classList.remove('voicecake-muted');
        micBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" x2="12" y1="19" y2="22"></line>
          </svg>
        `;
      } else {
        micBtn.classList.add('voicecake-muted');
        micBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" x2="12" y1="19" y2="22"></line>
            <path d="M2 2L22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      }
    },
    
    showLoading: function(show) {
      this.elements.loadingSpinner.style.display = show ? 'flex' : 'none';
    },
    
    addToAudioQueue: function(audioBlob) {
      this.refs.audioQueue.push(audioBlob);
      if (!this.refs.isPlaying) {
        this.playNext();
      }
    },
    
    playNext: async function() {
      if (this.refs.audioQueue.length === 0) {
        this.refs.isPlaying = false;
        return;
      }
      
      this.refs.isPlaying = true;
      const audioBlob = this.refs.audioQueue.shift();
      
      try {
        await this.initializeAudioContext();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await this.refs.audioContext.decodeAudioData(arrayBuffer);
        
        const source = this.refs.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.refs.audioContext.destination);
        
        source.onended = () => {
          this.refs.isPlaying = false;
          this.stopAudioWave();
          this.playNext();
        };
        
        this.startAudioWave();
        source.start(0);
      } catch (error) {
        console.error('Error playing audio:', error);
        this.refs.isPlaying = false;
        this.playNext();
      }
    },
    
    initializeAudioContext: async function() {
      if (!this.refs.audioContext || this.refs.audioContext.state === 'closed') {
        this.refs.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (this.refs.audioContext.state === 'suspended') {
        await this.refs.audioContext.resume();
      }
    },
    
    base64ToBlob: function(base64, mime = 'audio/wav') {
      try {
        const base64Data = base64.replace(/^data:audio\/[^;]+;base64,/, '');
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        return new Blob([bytes], { type: mime });
      } catch (error) {
        console.error('Error converting base64 to blob:', error);
        return null;
      }
    },
    
    cleanup: function() {
      // Stop call timer
      this.stopCallTimer();
      
      // Disconnect from LiveKit room
      if (this.refs.liveKitRoom) {
        try {
          this.refs.liveKitRoom.disconnect();
          console.log('🔌 Disconnected from LiveKit room');
        } catch (error) {
          console.warn('Error disconnecting from LiveKit room:', error);
        }
        this.refs.liveKitRoom = null;
      }
      
      // Clean up LiveKit audio elements
      const audioElements = document.querySelectorAll('audio[data-livekit-track]');
      audioElements.forEach(element => {
        try {
          element.remove();
        } catch (error) {
          console.warn('Error removing LiveKit audio element:', error);
        }
      });
      
      if (this.refs.mediaRecorder && this.refs.mediaRecorder.state !== 'inactive') {
        try {
          this.refs.mediaRecorder.stop();
        } catch (error) {
          console.warn('Error stopping media recorder:', error);
        }
      }
      
      if (this.refs.mediaStream) {
        this.refs.mediaStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (error) {
            console.warn('Error stopping track:', error);
          }
        });
      }
      
      if (this.refs.socket && this.refs.socket.readyState === WebSocket.OPEN) {
        this.refs.socket.close();
      }
      
      if (this.refs.audioContext && this.refs.audioContext.state !== 'closed') {
        try {
          this.refs.audioContext.close();
        } catch (error) {
          console.warn('Error closing audio context:', error);
        }
      }
      
      this.state.isConnected = false;
      this.state.isActive = false;
      this.state.isConnecting = false;
      this.state.hasPermissions = false;
      this.refs.isPlaying = false;
      this.refs.audioQueue = [];
      
      // Stop audio wave animations
      this.stopAudioWave();
      this.hideAudioWave();
    },
    
    // Audio Wave Control Functions
    showAudioWave: function() {
      if (this.elements.audioWave) {
        this.elements.audioWave.style.display = 'block';
      }
    },
    
    hideAudioWave: function() {
      if (this.elements.audioWave) {
        this.elements.audioWave.style.display = 'none';
      }
    },
    
    startAudioWave: function() {
      if (this.elements.waveBars) {
        this.elements.waveBars.forEach(bar => {
          bar.classList.add('voicecake-active');
        });
      }
    },
    
    stopAudioWave: function() {
      if (this.elements.waveBars) {
        this.elements.waveBars.forEach(bar => {
          bar.classList.remove('voicecake-active');
        });
      }
    },
    
    hideAudioWave: function() {
      if (this.elements.audioWave) {
        this.elements.audioWave.style.display = 'none';
      }
    },
    
    destroy: function() {
      this.cleanup();
      
      // Remove document event listener
      if (this.refs.documentClickListener) {
        document.removeEventListener('click', this.refs.documentClickListener);
        this.refs.documentClickListener = null;
      }
      
      if (this.elements.container && this.elements.container.parentNode) {
        this.elements.container.parentNode.removeChild(this.elements.container);
      }
      this.state.isInitialized = false;
    }
  };
  
  // Add CSS styles
  const style = document.createElement('style');
  style.textContent = `
    .voicecake-widget {
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .voicecake-widget.voicecake-bottom-left {
      bottom: 20px;
      left: 20px;
    }
    
    .voicecake-widget.voicecake-bottom-right {
      bottom: 20px;
      right: 20px;
    }
    
    .voicecake-widget-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .voicecake-widget-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
    }
    
    .voicecake-widget-popup {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 320px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px);
      transition: all 0.3s ease;
      overflow: hidden;
    }
    
    .voicecake-widget-popup.voicecake-active {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    

    
    .voicecake-widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .voicecake-widget-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .voicecake-widget-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .voicecake-status-indicator {
      width: 32px;
      height: 32px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .voicecake-status-indicator svg {
      width: 16px;
      height: 16px;
    }
    
    .voicecake-status-indicator.voicecake-idle {
      background: rgba(0, 0, 0, 0.1);
    }
    
    .voicecake-status-indicator.voicecake-connecting {
      background: rgba(245, 158, 11, 0.2);
      animation: pulse 1.5s infinite;
    }
    
    .voicecake-status-indicator.voicecake-active {
      background: rgba(16, 185, 129, 0.2);
      animation: pulse 1.5s infinite;
    }
    
    .voicecake-status-indicator.voicecake-error {
      background: rgba(239, 68, 68, 0.2);
    }
    
    .voicecake-widget-title-text h3 {
      font-weight: 600;
      font-size: 14px;
      margin: 0;
      color: #374151;
    }
    
    .voicecake-widget-title-text p {
      font-size: 12px;
      margin: 0;
      opacity: 0.9;
      color: #6b7280;
    }
    
    .voicecake-widget-close {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.1);
      border: none;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .voicecake-widget-close:hover {
      background: rgba(0, 0, 0, 0.2);
    }
    
    .voicecake-widget-close svg {
      width: 12px;
      height: 12px;
    }
    
    .voicecake-widget-content {
      padding: 16px;
    }
    
    .voicecake-widget-controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .voicecake-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      width: 100%;
    }
    
    .voicecake-btn svg {
      width: 16px;
      height: 16px;
    }
    
    .voicecake-btn-primary {
      background: #f8fafc;
      color: #374151;
      border: 1px solid #e5e7eb;
    }
    
    .voicecake-btn-primary:hover {
      background: #f1f5f9;
    }
    
    .voicecake-btn-secondary {
      background: #ef4444;
      color: white;
    }
    
    .voicecake-btn-secondary:hover {
      background: #dc2626;
    }
    
    .voicecake-btn-mic {
      background: #10b981;
      color: white;
    }
    
    .voicecake-btn-mic:hover {
      background: #059669;
    }
    
    .voicecake-btn-mic.voicecake-muted {
      background: #f59e0b;
    }
    
    .voicecake-btn-mic.voicecake-muted:hover {
      background: #d97706;
    }
    
    .voicecake-call-timer {
      text-align: center;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }
    
    .voicecake-timer-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 12px;
      color: #6b7280;
    }
    
    .voicecake-timer-display::before {
      content: '';
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    
    .text-center {
      text-align: center;
    }
    
    .mb-4 {
      margin-bottom: 16px;
    }
    
    .mb-3 {
      margin-bottom: 12px;
    }
    
    .mb-2 {
      margin-bottom: 8px;
    }
    
    .w-16 {
      width: 64px;
    }
    
    .h-16 {
      height: 64px;
    }
    
    .bg-accent\/10 {
      background: rgba(0, 0, 0, 0.1);
    }
    
    .rounded-full {
      border-radius: 50%;
    }
    
    .flex {
      display: flex;
    }
    
    .items-center {
      align-items: center;
    }
    
    .justify-center {
      justify-content: center;
    }
    
    .mx-auto {
      margin-left: auto;
      margin-right: auto;
    }
    
    .w-8 {
      width: 32px;
    }
    
    .h-8 {
      height: 32px;
    }
    
    .text-accent {
      color: #667eea;
    }
    
    .font-semibold {
      font-weight: 600;
    }
    
    .text-foreground {
      color: #374151;
    }
    
    .text-sm {
      font-size: 14px;
    }
    
    .text-muted-foreground {
      color: #6b7280;
    }
    
    .mt-4 {
      margin-top: 16px;
    }
    
    .pt-3 {
      padding-top: 12px;
    }
    
    .border-t {
      border-top: 1px solid #e5e7eb;
    }
    
    .border-border {
      border-color: #e5e7eb;
    }
    
    .space-x-2 > * + * {
      margin-left: 8px;
    }
    
    .text-xs {
      font-size: 12px;
    }
    
    .w-2 {
      width: 8px;
    }
    
    .h-2 {
      height: 8px;
    }
    
    .bg-green-500 {
      background: #10b981;
    }
    
    .animate-pulse {
      animation: pulse 1.5s infinite;
    }
    
    .voicecake-widget-loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-size: 14px;
      color: #666;
    }
    
    .voicecake-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #f0f0f0;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Audio Wave Visualization */
    .voicecake-audio-wave {
      margin: 16px 0;
      padding: 16px;
      background: rgba(102, 126, 234, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(102, 126, 234, 0.1);
    }
    
    .voicecake-wave-container {
      margin-bottom: 12px;
    }
    
    .voicecake-wave-container:last-child {
      margin-bottom: 0;
    }
    
    .voicecake-wave-label {
      font-size: 12px;
      font-weight: 500;
      color: #667eea;
      margin-bottom: 8px;
      text-align: center;
    }
    
    .voicecake-wave-bars {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      height: 40px;
    }
    
    .voicecake-wave-bar {
      width: 4px;
      height: 4px;
      background: rgba(102, 126, 234, 0.2);
      border-radius: 2px;
      transition: all 0.1s ease;
    }
    
    .voicecake-wave-bar.voicecake-active {
      background: #667eea;
      animation: voicecake-wave-animation 0.6s ease-in-out infinite;
    }
    
    .voicecake-wave-bar.voicecake-active:nth-child(1) { animation-delay: 0s; }
    .voicecake-wave-bar.voicecake-active:nth-child(2) { animation-delay: 0.1s; }
    .voicecake-wave-bar.voicecake-active:nth-child(3) { animation-delay: 0.2s; }
    .voicecake-wave-bar.voicecake-active:nth-child(4) { animation-delay: 0.3s; }
    .voicecake-wave-bar.voicecake-active:nth-child(5) { animation-delay: 0.4s; }
    .voicecake-wave-bar.voicecake-active:nth-child(6) { animation-delay: 0.5s; }
    .voicecake-wave-bar.voicecake-active:nth-child(7) { animation-delay: 0.6s; }
    .voicecake-wave-bar.voicecake-active:nth-child(8) { animation-delay: 0.7s; }
    
    @keyframes voicecake-wave-animation {
      0%, 100% { height: 4px; }
      50% { height: 24px; }
    }
    
    @media (max-width: 480px) {
      .voicecake-widget-popup {
        width: calc(100vw - 48px);
        right: 24px;
        left: 24px;
      }
    }
  `;
  
  document.head.appendChild(style);
  
  // Expose to global scope
  window.VoiceCakeWidget = VoiceCakeWidget;
  
  // Auto-initialize if config is provided via data attributes
  function initializeWidget() {
    // Try to get config from script tag
    let scriptElement = document.currentScript;
    
    // Fallback: find the script tag by src
    if (!scriptElement) {
      const scripts = document.querySelectorAll('script[src*="voicecake-widget.js"]');
      if (scripts.length > 0) {
        scriptElement = scripts[scripts.length - 1];
      }
    }
    
    if (scriptElement && scriptElement.dataset.agentId) {
      const config = {
        agentId: scriptElement.dataset.agentId,
        position: scriptElement.dataset.position || 'bottom-right',
        theme: scriptElement.dataset.theme || 'light',
        size: scriptElement.dataset.size || 'medium'
      };
      
      console.log('VoiceCake Widget: Auto-initializing with config:', config);
      VoiceCakeWidget.init(config);
    } else {
      console.log('VoiceCake Widget: Loaded successfully. Use VoiceCakeWidget.init() to initialize.');
    }
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidget);
  } else {
    // DOM is already ready
    initializeWidget();
  }
  
})();
