import axios from 'axios';

const getApiBaseUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;

    // If we have an env var, use it (standard path)
    if (envUrl) {
        if (envUrl.includes('/api/v1')) return envUrl;
        return `${envUrl.replace(/\/$/, '')}/api/v1`;
    }

    // Smart Fallback for Render: Detects backend by replacing '-frontend' with '-backend'
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('.onrender.com')) {
        const backendHost = window.location.hostname.replace('-frontend.', '-backend.');
        return `https://${backendHost}/api/v1`;
    }

    // Default fallback (using the specific subdomain from the user screenshot)
    return 'https://antigravity-backend-8ytp.onrender.com/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for JWT
apiClient.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for auth errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('access_token');
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
