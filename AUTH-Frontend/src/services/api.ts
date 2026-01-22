import axios from 'axios';
import { ApiResponse, LoginData } from '../types';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: apiBase,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add the Auth Token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Flag and queue to prevent multiple refresh calls simultaneously
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response Interceptor to handle 401s and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't already retried this request
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If already refreshing, wait for that to finish and then retry this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                isRefreshing = false;
                // No refresh token, force logout or handle appropriately
                return Promise.reject(error);
            }

            try {
                console.log('🔄 Token expired, attempting refresh...');
                const response = await axios.post<ApiResponse<LoginData>>(`${apiBase}/api/UserAuth/refresh-token`, {
                    refreshToken: refreshToken,
                });

                if (response.data.success) {
                    const { token: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

                    console.log('✅ Token refreshed successfully');
                    localStorage.setItem('authToken', newAccessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                    processQueue(null, newAccessToken);
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('❌ Token refresh failed:', refreshError);
                processQueue(refreshError, null);

                // Logout if refresh fails
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userRoles');
                window.location.href = '/login';

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
