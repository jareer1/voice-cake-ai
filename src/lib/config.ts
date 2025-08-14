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
    console.log('Deepgram Text Endpoint:', config.websocket.deepgramTextEndpoint);
  },
  
  // Environment
  env: import.meta.env.NODE_ENV || "development",
  
  // Helper functions
  getHumeWebSocketUrl: (agentId: string, agentType?: string) => {
    const endpoint = agentType === 'TEXT' 
      ? config.websocket.deepgramTextEndpoint 
      : config.websocket.humeEndpoint;
    return `${config.websocket.baseURL}${endpoint}/${agentId}`;
  },
  
  isDevelopment: () => config.env === "development",
  isProduction: () => config.env === "production",
};

export default config;
