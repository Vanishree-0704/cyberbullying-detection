import axios from 'axios';

// Forcing 127.0.0.1 to bypass any localhost resolution issues on Windows
const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('cyberguard_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('cyberguard_token');
            localStorage.removeItem('cyberguard_user');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
