// API Configuration
// This file centralizes all API endpoint URLs

const getApiUrl = () => {
    // Check if we're in production (deployed) or development (local)
    if (import.meta.env.VITE_API_URL) {
        // Use environment variable if set (for production)
        return import.meta.env.VITE_API_URL;
    }

    // Default to localhost for development
    return 'http://localhost:3001';
};

export const API_URL = getApiUrl();
export const API_BASE = `${API_URL}/api`;

// Always log for debugging (even in production)
console.log('🔍 API Configuration Debug:', {
    API_URL,
    API_BASE,
    environment: import.meta.env.MODE,
    VITE_API_URL_env: import.meta.env.VITE_API_URL,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    allEnvVars: import.meta.env
});
