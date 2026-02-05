/**
 * TaskBuddy - Axios API Configuration
 * 
 * This module configures the Axios HTTP client for API communication
 * with the Django backend. It includes:
 * - Base URL configuration
 * - JWT authentication token injection
 * - Automatic token refresh on 401 responses
 * - Request queuing during token refresh
 * 
 * @module api/axios
 * @version 2.0.0
 */

import axios from 'axios';

/**
 * Base URL for all API requests.
 * Should match the Django backend server address.
 * @constant {string}
 */
let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// If VITE_API_URL comes from Render's "host" property, it won't have a protocol
if (baseUrl && !baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
}
const API_URL = `${baseUrl}/api`;

/**
 * Pre-configured Axios instance for API requests.
 * Automatically includes authentication headers and handles token refresh.
 * 
 * @example
 * // GET request
 * const response = await api.get('/tasks/');
 * 
 * // POST request with data
 * const newTask = await api.post('/tasks/', { title: 'New Task' });
 * 
 * // PATCH request with authentication
 * await api.patch(`/tasks/${id}/toggle/`);
 */
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================================================
// TOKEN REFRESH STATE MANAGEMENT
// ============================================================================

/**
 * Flag indicating if a token refresh is currently in progress.
 * Used to prevent multiple simultaneous refresh attempts.
 * @type {boolean}
 */
let isRefreshing = false;

/**
 * Queue of pending requests waiting for token refresh.
 * Each entry contains resolve/reject callbacks for the original request.
 * @type {Array<{resolve: Function, reject: Function}>}
 */
let failedQueue = [];

/**
 * Process all queued requests after token refresh completes.
 * 
 * @param {Error|null} error - Error if refresh failed, null if successful
 * @param {string|null} token - New access token if refresh successful
 */
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

/**
 * Request interceptor for adding JWT authentication.
 * 
 * Automatically attaches the access token from localStorage
 * to all outgoing requests as a Bearer token.
 * 
 * @param {Object} config - Axios request configuration
 * @returns {Object} Modified request configuration with auth header
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

/**
 * Response interceptor for handling 401 Unauthorized responses.
 * 
 * When the access token expires (401 response), this interceptor:
 * 1. Attempts to refresh the token using the refresh token
 * 2. Queues all concurrent requests during refresh
 * 3. Retries all queued requests with the new token
 * 4. Redirects to login if refresh fails
 * 
 * @param {Object} response - Successful response (passed through)
 * @param {Object} error - Error response to handle
 * @returns {Promise} Resolved with retried request or rejected with error
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check if error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't try to refresh if this was already the refresh request
            if (originalRequest.url === '/token/refresh/') {
                return Promise.reject(error);
            }

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');
            
            if (!refreshToken) {
                // No refresh token available - redirect to login
                isRefreshing = false;
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                // Attempt to refresh the access token
                const response = await axios.post(`${API_URL}/token/refresh/`, {
                    refresh: refreshToken
                });

                const { access } = response.data;
                
                // Store new access token
                localStorage.setItem('access_token', access);
                
                // Update default authorization header
                api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
                
                // Process queued requests with new token
                processQueue(null, access);
                
                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
                
            } catch (refreshError) {
                // Token refresh failed - clear tokens and redirect to login
                processQueue(refreshError, null);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
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
