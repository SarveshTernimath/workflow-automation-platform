import axios from 'axios';

const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // If we are on a Render frontend, guess the backend URL if not provided
        if (hostname.includes('onrender.com') && !process.env.NEXT_PUBLIC_API_URL) {
            const baseName = hostname.split('.')[0].replace('-frontend', '');
            return `https://${baseName}-backend.onrender.com/api/v1`;
        }
    }
    return process.env.NEXT_PUBLIC_API_URL || 'https://antigravity-backend.onrender.com/api/v1';
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
