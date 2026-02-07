// Configuration for the application
export const config = {
    api: {
        baseUrl: (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'),
        timeout: 10000,
    },
    app: {
        name: "project_saas",
        version: "1.0.0",
    },
    features: {
        enableNotifications: true,
        enableRealTimeUpdates: false,
    },
};

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'); 