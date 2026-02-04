/**
 * TaskBuddy - Notification Context Provider
 * 
 * This module provides centralized notification management using
 * React Context API. It handles fetching notifications from the
 * backend, browser push notifications, and in-app toast display.
 * 
 * Features:
 * - Browser push notification support (with permission)
 * - Automatic polling every 60 seconds
 * - Toast integration for in-app alerts
 * - Notification dismissal
 * - Visibility change detection for re-fetching
 * 
 * Notification Types:
 * - due_today: Tasks due today
 * - overdue: Tasks past their due date
 * - reminder: Scheduled reminder times
 * - streak: Daily check-in reminders
 * 
 * @module context/NotificationContext
 * @version 2.0.0
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import api from '../api/axios';

/**
 * Notification context for sharing notification state across components.
 * @type {React.Context}
 */
const NotificationContext = createContext(null);

/**
 * Custom hook for accessing notification context.
 * 
 * Provides access to notifications, permission status,
 * and notification action functions.
 * 
 * @returns {NotificationContextValue} Notification context value
 * @throws {Error} If used outside of NotificationProvider
 * 
 * @example
 * const { notifications, notificationCount, requestPermission } = useNotifications();
 * 
 * // Request browser notification permission
 * await requestPermission();
 * 
 * // Access notification count for badge
 * <Badge count={notificationCount} />
 */
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

/**
 * Notification Provider component.
 * 
 * Wraps the application to provide notification state and
 * functions to all child components via React Context.
 * Automatically polls for new notifications when authenticated.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Context provider wrapping children
 * 
 * @example
 * // In App.jsx
 * <AuthProvider>
 *   <ToastProvider>
 *     <NotificationProvider>
 *       <App />
 *     </NotificationProvider>
 *   </ToastProvider>
 * </AuthProvider>
 */
export const NotificationProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const toast = useToast();

    /**
     * Array of pending notification objects.
     * @type {Array<Object>}
     */
    const [notifications, setNotifications] = useState([]);

    /**
     * Loading state for notification fetch.
     * @type {boolean}
     */
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Browser notification permission status.
     * @type {('default'|'granted'|'denied')}
     */
    const [permission, setPermission] = useState('default');

    /**
     * Reference to the polling interval timer.
     * @type {React.MutableRefObject<number|null>}
     */
    const pollIntervalRef = useRef(null);

    /**
     * Set of notification IDs that have already been shown.
     * Prevents duplicate toast/browser notifications.
     * @type {React.MutableRefObject<Set<string>>}
     */
    const shownNotificationsRef = useRef(new Set());

    /**
     * Request browser notification permission.
     * 
     * Prompts the user to allow browser push notifications.
     * Returns true if permission is granted.
     * 
     * @async
     * @returns {Promise<boolean>} Whether permission was granted
     */
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.log('Browser does not support notifications');
            return false;
        }

        const result = await Notification.requestPermission();
        setPermission(result);
        return result === 'granted';
    }, []);

    /**
     * Show a browser push notification.
     * 
     * Only displays when permission is granted and the
     * document is hidden (user is on another tab).
     * 
     * @param {string} title - Notification title
     * @param {Object} [options={}] - Notification options (body, icon, etc.)
     */
    const showBrowserNotification = useCallback((title, options = {}) => {
        if (permission === 'granted' && document.hidden) {
            const notification = new Notification(title, {
                icon: '/vite.svg',
                badge: '/vite.svg',
                ...options
            });

            // Focus window when notification is clicked
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            // Auto-close after 5 seconds
            setTimeout(() => notification.close(), 5000);
        }
    }, [permission]);

    /**
     * Fetch notifications from the backend API.
     * 
     * Retrieves pending notifications and shows toast/browser
     * notifications for new items that haven't been shown yet.
     * 
     * @async
     */
    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;

        setIsLoading(true);
        try {
            const response = await api.get('/notifications/');
            const newNotifications = response.data.notifications || [];

            // Show notifications for new items only
            newNotifications.forEach(notif => {
                if (!shownNotificationsRef.current.has(notif.id)) {
                    // Show appropriate toast based on notification type
                    if (notif.type === 'overdue') {
                        toast.warning(notif.message);
                    } else if (notif.type === 'due_today') {
                        toast.info(notif.message);
                    } else if (notif.type === 'reminder') {
                        toast.info(notif.message);
                        // Also show browser notification for reminders
                        showBrowserNotification(notif.title, { body: notif.message });
                    } else if (notif.type === 'streak') {
                        toast.warning(notif.message);
                    }

                    // Track as shown to prevent duplicates
                    shownNotificationsRef.current.add(notif.id);
                }
            });

            setNotifications(newNotifications);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
        setIsLoading(false);
    }, [isAuthenticated, toast, showBrowserNotification]);

    /**
     * Dismiss a notification by ID.
     * 
     * Sends dismissal to backend and removes from local state.
     * 
     * @async
     * @param {string} notificationId - ID of notification to dismiss
     */
    const dismissNotification = useCallback(async (notificationId) => {
        try {
            await api.post(`/notifications/${notificationId}/dismiss/`);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Failed to dismiss notification:', error);
        }
    }, []);

    /**
     * Clear the shown notifications cache.
     * 
     * Useful when you want to re-show all notifications
     * (e.g., after a long period of inactivity).
     */
    const clearShownNotifications = useCallback(() => {
        shownNotificationsRef.current.clear();
    }, []);

    // Initialize polling when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            // Check current browser notification permission
            if ('Notification' in window) {
                setPermission(Notification.permission);
            }

            // Fetch notifications immediately
            fetchNotifications();

            // Set up polling interval (every 60 seconds)
            pollIntervalRef.current = setInterval(fetchNotifications, 60000);

            return () => {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                }
            };
        }
    }, [isAuthenticated, fetchNotifications]);

    // Re-fetch when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isAuthenticated) {
                fetchNotifications();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isAuthenticated, fetchNotifications]);

    /**
     * Context value containing notification state and functions.
     * @type {NotificationContextValue}
     */
    const value = {
        /** Array of pending notifications */
        notifications,
        /** Whether notifications are currently loading */
        isLoading,
        /** Browser notification permission status */
        permission,
        /** Request browser notification permission */
        requestPermission,
        /** Manually fetch notifications */
        fetchNotifications,
        /** Dismiss a specific notification */
        dismissNotification,
        /** Show a browser push notification */
        showBrowserNotification,
        /** Clear shown notification cache */
        clearShownNotifications,
        /** Count of pending notifications (for badges) */
        notificationCount: notifications.length
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
