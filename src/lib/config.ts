// Environment Configuration
export const config = {
  // API Configuration
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  },
  
  // WebSocket Configuration
  websocket: {
    baseURL: import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000",
    humeEndpoint: import.meta.env.VITE_HUME_WS_ENDPOINT || "/api/v1/hume/ws/inference",
  },
  
  // Environment
  env: import.meta.env.NODE_ENV || "development",
  
  // Helper functions
  getHumeWebSocketUrl: (agentId: string) => {
    return `${config.websocket.baseURL}${config.websocket.humeEndpoint}/${agentId}`;
  },
  
  isDevelopment: () => config.env === "development",
  isProduction: () => config.env === "production",
};

export default config;
