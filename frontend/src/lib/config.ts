// Configuration for the application
export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
    timeout: 10000, // 10 seconds
  },
  
  // App Configuration
  app: {
    name: 'Sakom',
    version: '1.0.0',
  },
  
  // Feature flags
  features: {
    enableNotifications: true,
    enableRealTimeUpdates: false,
  },
} as const; 