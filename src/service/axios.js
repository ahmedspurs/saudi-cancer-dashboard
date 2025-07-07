import router from '@/router';
import axios from 'axios';

// Create axios instance
const instance = axios.create({
    baseURL: 'http://localhost:3030/api/',
    timeout: 60000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// State management for token refresh
let isRefreshing = false;
let failedQueue = [];

// Process queued requests
const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        error ? reject(error) : resolve(token);
    });
    failedQueue = [];
};

// Request interceptor
instance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        console.log('Access token:', accessToken);
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

instance.interceptors.response.use(
    async (response) => {
        const originalRequest = response.config;

        console.log({ response })
        if (response.status == 401) {
            if (response?.status === 401 && !originalRequest._retry) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then((token) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return instance(originalRequest);
                        })
                        .catch((err) => Promise.reject(err));
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    console.log('Attempting to refresh token using HTTP-only cookie...');
                    const response = await instance.post('tokens/refresh-token');
                    console.log('Refresh token response:', response.data);

                    const newAccessToken = response.data.accessToken || response.data.token || response.data.data?.accessToken;
                    const newRefreshToken = response.data.refreshToken || response.data.data?.refreshToken;

                    if (!newAccessToken) {
                        throw new Error('No access token in refresh response');
                    }

                    localStorage.setItem('accessToken', newAccessToken);
                    // Note: No need to store refreshToken in localStorage since it's in an HTTP-only cookie
                    instance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                    processQueue(null, newAccessToken);

                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return instance(originalRequest);
                } catch (refreshError) {
                    console.error('Refresh token error:', refreshError.response?.data || refreshError.message);
                    processQueue(refreshError);

                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('user');

                    router.push({
                        path: '/auth/login',
                        query: { error: 'session_expired' },
                    });

                    return Promise.reject({
                        ...refreshError,
                        message: refreshError.response?.data?.message || 'Failed to refresh token',
                    });
                } finally {
                    isRefreshing = false;
                }
            }

            const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
            return Promise.reject({ ...error, message: errorMessage });

        }
        return response;
    },

    async (error) => {
        const originalRequest = error.config;
        console.log({ error });
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return instance(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log('Attempting to refresh token using HTTP-only cookie...');
                const response = await instance.post('tokens/refresh-token');
                console.log('Refresh token response:', response.data);

                const newAccessToken = response.data.accessToken || response.data.token || response.data.data?.accessToken;
                const newRefreshToken = response.data.refreshToken || response.data.data?.refreshToken;

                if (!newAccessToken) {
                    throw new Error('No access token in refresh response');
                }

                localStorage.setItem('accessToken', newAccessToken);
                // Note: No need to store refreshToken in localStorage since it's in an HTTP-only cookie
                instance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                processQueue(null, newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return instance(originalRequest);
            } catch (refreshError) {
                console.error('Refresh token error:', refreshError.response?.data || refreshError.message);
                processQueue(refreshError);

                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');

                await router.push({
                    path: '/auth/login',
                    query: { error: 'session_expired' },
                });

                return Promise.reject({
                    ...refreshError,
                    message: refreshError.response?.data?.message || 'Failed to refresh token',
                });
            } finally {
                isRefreshing = false;
            }
        }

        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
        return Promise.reject({ ...error, message: errorMessage });

    }
);

// Utility methods for common operations
export const api = {
    instance,

    // Clear authentication data
    clearAuth() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
    },

    // Set new token
    setToken(token) {
        localStorage.setItem('accessToken', token);
        instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    },
};

export default instance;