// Environment Configuration
export const config = {
  // API Configuration
  api: {
    baseURL: (() => {
      const envUrl = import.meta.env.VITE_API_BASE_URL;
      const defaultUrl = "https://voicecake-ame5ascacvgrgde6.canadacentral-01.azurewebsites.net/api/v1";
      const finalUrl = envUrl || defaultUrl;
      
      // Force HTTPS if the URL contains the Azure domain
      if (finalUrl.includes('voicecake-ame5ascacvgrgde6.canadacentral-01.azurewebsites.net') && finalUrl.startsWith('http://')) {
        return finalUrl.replace('http://', 'https://');
      }
      
      return finalUrl;
    })(),
  },
  
  // WebSocket Configuration
  websocket: {
    baseURL: (() => {
      const envUrl = import.meta.env.VITE_WS_BASE_URL;
      const defaultUrl = "wss://voicecake-ame5ascacvgrgde6.canadacentral-01.azurewebsites.net";
      const finalUrl = envUrl || defaultUrl;
      
      // Force WSS if the URL contains the Azure domain
      if (finalUrl.includes('voicecake-ame5ascacvgrgde6.canadacentral-01.azurewebsites.net') && finalUrl.startsWith('ws://')) {
        return finalUrl.replace('ws://', 'wss://');
      }
      
      return finalUrl;
    })(),
    humeEndpoint: import.meta.env.VITE_HUME_WS_ENDPOINT || "/api/v1/hume/ws/inference",
    // Updated to use LiveKit endpoints for TEXT-TO-SPEECH
    livekitTextEndpoint: "/api/v1/livekit/ws/voice",
    // Keep legacy endpoint for backwards compatibility
    deepgramTextEndpoint: "/api/v1/deepgram/ws/voice",
  },
  
  // Debug logging
  debug: () => {
    console.log('Environment Variables:');
    console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('VITE_WS_BASE_URL:', import.meta.env.VITE_WS_BASE_URL);
    console.log('VITE_HUME_WS_ENDPOINT:', import.meta.env.VITE_HUME_WS_ENDPOINT);
    console.log('Final API Base URL:', config.api.baseURL);
    console.log('Final WS Base URL:', config.websocket.baseURL);
    console.log('Hume Endpoint:', config.websocket.humeEndpoint);
    console.log('LiveKit Text Endpoint:', config.websocket.livekitTextEndpoint);
    console.log('Deepgram Text Endpoint (Legacy):', config.websocket.deepgramTextEndpoint);
  },
  
  // Environment
  env: import.meta.env.NODE_ENV || "development",
  
  // Helper functions
  getHumeWebSocketUrl: (agentId: string, agentType?: string) => {
    // TEXT agents now use LiveKit sessions (HTTP POST), not WebSocket
    if (agentType === 'TEXT') {
      console.warn('⚠️ TEXT agents should use LiveKit session API, not WebSocket');
      return null; // TEXT agents should not use WebSocket
    }
    
    const endpoint = config.websocket.humeEndpoint;
    return `${config.websocket.baseURL}${endpoint}/${agentId}`;
  },
  
  // Debug helper to show endpoint routing
  getEndpointInfo: (agentType?: string) => {
    const isTextAgent = agentType === 'TEXT';
    return {
      agentType: agentType || 'SPEECH',
      endpoint: isTextAgent ? 'LiveKit Session API' : config.websocket.humeEndpoint,
      service: isTextAgent ? 'LiveKit Session (TEXT-TO-SPEECH)' : 'Hume WebSocket (SPEECH-TO-SPEECH)',
      description: isTextAgent 
        ? 'Using LiveKit session API for text-based voice generation with HTTP POST'
        : 'Using Hume WebSocket for real-time speech-to-speech conversation'
    };
  },
  
  isDevelopment: () => config.env === "development",
  isProduction: () => config.env === "production",
};

export default config;
