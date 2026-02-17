import axios from 'axios';

const getApiBaseUrl = () => {
    // 1. Try Environment Variable (standard for Next.js/Render)
    if (process.env.NEXT_PUBLIC_API_URL) {
        const url = `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api/v1`;
        console.log(`[NexusFlow] Connecting to Matrix via ENV: ${url}`);
        return url;
    }

    // 2. Hardcoded fallback (the precise backend URL for this deployment)
    const url = 'https://antigravity-backend-8ytp.onrender.com/api/v1';
    console.log(`[NexusFlow] Connecting to Hardcoded Matrix: ${url}`);
    return url;
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
