/**
 * TaskBuddy - Authentication Context Provider
 * 
 * This module provides centralized authentication state management
 * using React Context API. It handles login, registration, logout,
 * and persistent session management.
 * 
 * Features:
 * - JWT token-based authentication
 * - Automatic token persistence in localStorage
 * - User profile fetching on app load
 * - Loading states for auth operations
 * 
 * @module context/AuthContext
 * @version 2.0.0
 */

import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../api/axios';

/**
 * Authentication context for sharing auth state across components.
 * @type {React.Context}
 */
const AuthContext = createContext(null);

/**
 * Custom hook for accessing authentication context.
 * 
 * Provides access to user state, authentication status,
 * and auth action functions (login, register, logout).
 * 
 * @returns {AuthContextValue} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 * 
 * @example
 * const { user, login, logout, isAuthenticated } = useAuth();
 * 
 * // Check if user is logged in
 * if (isAuthenticated) {
 *   console.log(`Welcome, ${user.username}!`);
 * }
 * 
 * // Handle login
 * await login('username', 'password');
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Authentication Provider component.
 * 
 * Wraps the application to provide authentication state and
 * functions to all child components via React Context.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Context provider wrapping children
 * 
 * @example
 * // In App.jsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export const AuthProvider = ({ children }) => {
    /**
     * Current authenticated user object or null if not logged in.
     * @type {Object|null}
     */
    const [user, setUser] = useState(null);

    /**
     * Global loading state for initial auth check.
     * @type {boolean}
     */
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Fetch user profile from API and update state.
     * Called on app load if tokens exist in localStorage.
     * 
     * @async
     * @returns {Promise<void>}
     */
    const fetchProfile = useCallback(async () => {
        try {
            const response = await api.get('/user/profile/');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            // Token might be invalid - clear auth state
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setUser(null);
        }
    }, []);

    // Check for existing tokens on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                await fetchProfile();
            }
            setIsLoading(false);
        };
        initAuth();
    }, [fetchProfile]);

    /**
     * Authenticate user with credentials.
     * 
     * Sends login request to API, stores JWT tokens,
     * and fetches user profile on success.
     * 
     * @async
     * @param {string} username - User's username
     * @param {string} password - User's password
     * @throws {Error} If authentication fails
     * 
     * @example
     * try {
     *   await login('john_doe', 'securePassword123');
     *   navigate('/dashboard');
     * } catch (error) {
     *   showError('Invalid credentials');
     * }
     */
    const login = async (username, password) => {
        try {
            const response = await api.post('/token/', { username, password });
            const { access, refresh } = response.data;

            // Store tokens in localStorage for persistence
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);

            // Fetch user profile after successful login
            await fetchProfile();
            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            const message = error.response?.data?.detail ||
                error.response?.data?.message ||
                'Invalid credentials. Please try again.';
            return { success: false, error: message };
        }
    };

    /**
     * Register a new user account.
     * 
     * Creates new account and automatically logs in the user
     * on successful registration.
     * 
     * @async
     * @param {string} username - Desired username
     * @param {string} email - User's email address
     * @param {string} password - Password (min 8 characters)
     * @throws {Error} If registration fails (duplicate email, weak password, etc.)
     * 
     * @example
     * try {
     *   await register('jane_doe', 'jane@example.com', 'securePassword123');
     *   navigate('/dashboard');
     * } catch (error) {
     *   showError(error.response.data.message);
     * }
     */
    const register = async (username, email, password) => {
        try {
            await api.post('/register/', { username, email, password });
            // Registration successful - return success (don't auto-login, let page redirect to login)
            return { success: true };
        } catch (error) {
            console.error('Registration failed:', error);
            // Extract error message from various response formats
            let message = 'Registration failed. Please try again.';
            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === 'string') {
                    message = data;
                } else if (data.detail) {
                    message = data.detail;
                } else if (data.username) {
                    message = `Username: ${data.username.join(', ')}`;
                } else if (data.email) {
                    message = `Email: ${data.email.join(', ')}`;
                } else if (data.password) {
                    message = `Password: ${data.password.join(', ')}`;
                }
            }
            return { success: false, error: message };
        }
    };

    /**
     * Log out the current user.
     * 
     * Clears all authentication tokens and user state.
     * Does not make an API call (JWT is stateless).
     * 
     * @example
     * logout();
     * navigate('/login');
     */
    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    /**
     * Context value containing auth state and functions.
     * @type {AuthContextValue}
     */
    const value = {
        /** Current user object or null */
        user,
        /** Whether a user is currently authenticated */
        isAuthenticated: !!user,
        /** Whether initial auth check is in progress */
        isLoading,
        /** Login function */
        login,
        /** Registration function */
        register,
        /** Logout function */
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
