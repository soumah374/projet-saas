// Configuration for the application
export const config = {
    api: {
        baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
        timeout: 10000,
    },
    app: {
        name: "Sakom",
        version: "1.0.0",
    },
    features: {
        enableNotifications: true,
        enableRealTimeUpdates: false,
    },
}; 