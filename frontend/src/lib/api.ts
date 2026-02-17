import axios from 'axios';

const getApiBaseUrl = () => {
    // Build version to verify deployment in browser console
    const buildVersion = '2026-02-18-v2';
    console.log(`[NexusFlow] Build Version: ${buildVersion}`);

    // 1. Try Environment Variable (standard for Next.js/Render)
    let envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) {
        // Ensure absolute URL (add https:// if only hostname provided)
        if (!envUrl.startsWith('http')) {
            envUrl = `https://${envUrl}`;
        }
        const url = `${envUrl.replace(/\/$/, '')}/api/v1`;
        console.log(`[NexusFlow] Matrix Connection via ENV: ${url}`);
        return url;
    }

    // 2. Hardcoded fallback (the precise backend URL for this deployment)
    const url = 'https://antigravity-backend-8ytp.onrender.com/api/v1';
    console.log(`[NexusFlow] Matrix Connection via FALLBACK: ${url}`);
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
