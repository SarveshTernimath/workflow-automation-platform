import axios from 'axios';

const getApiBaseUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    // Fallback to the likely production URL if env var is missing
    if (!envUrl) return 'https://antigravity-backend.onrender.com/api/v1';

    // If it already has the version prefix, return it
    if (envUrl.includes('/api/v1')) return envUrl;

    // Otherwise append it, ensuring no double slashes
    return `${envUrl.replace(/\/$/, '')}/api/v1`;
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
