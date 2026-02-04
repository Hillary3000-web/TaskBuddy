/**
 * TaskBuddy - Toast Notification Context Provider
 * 
 * This module provides a centralized toast notification system
 * using React Context API. It enables components throughout the
 * application to display success, error, warning, and info messages.
 * 
 * Features:
 * - Multiple toast variants (success, error, warning, info)
 * - Automatic dismissal with configurable duration
 * - Slide-up animation on entry
 * - Manual dismiss capability
 * - Toast stacking for multiple notifications
 * 
 * @module context/ToastContext
 * @version 2.0.0
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Toast notification context for sharing toast functions across components.
 * @type {React.Context}
 */
const ToastContext = createContext(null);

/**
 * Custom hook for accessing toast notification functions.
 * 
 * Provides methods to show success, error, warning, and info toasts
 * from any component in the application.
 * 
 * @returns {ToastContextValue} Toast context value with notification methods
 * @throws {Error} If used outside of ToastProvider
 * 
 * @example
 * const toast = useToast();
 * 
 * // Show different toast types
 * toast.success('Task completed!');
 * toast.error('Failed to save changes');
 * toast.warning('Approaching deadline');
 * toast.info('Tip: Use keyboard shortcuts');
 */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

/**
 * Toast icons mapped by variant type.
 * @constant {Object.<string, React.Component>}
 */
const TOAST_ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

/**
 * Toast styling classes mapped by variant type.
 * Includes border colors, background colors, and icon colors.
 * @constant {Object.<string, string>}
 */
const TOAST_STYLES = {
    success: 'border-emerald-500 bg-emerald-500/10 text-emerald-500',
    error: 'border-red-500 bg-red-500/10 text-red-500',
    warning: 'border-amber-500 bg-amber-500/10 text-amber-500',
    info: 'border-indigo-500 bg-indigo-500/10 text-indigo-500',
};

/**
 * Toast Notification Provider component.
 * 
 * Wraps the application to provide toast notification capabilities
 * to all child components via React Context.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Context provider with toast container
 * 
 * @example
 * // In App.jsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export const ToastProvider = ({ children }) => {
    /**
     * Array of active toast notifications.
     * Each toast has id, message, and variant.
     * @type {Array<{id: number, message: string, variant: string}>}
     */
    const [toasts, setToasts] = useState([]);

    /**
     * Remove a toast notification by ID.
     * 
     * @param {number} id - Toast ID to remove
     */
    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    /**
     * Add a new toast notification.
     * 
     * Creates a toast with the specified message and variant,
     * and automatically removes it after the specified duration.
     * 
     * @param {string} message - Toast message to display
     * @param {('success'|'error'|'warning'|'info')} variant - Toast type
     * @param {number} [duration=4000] - Auto-dismiss duration in milliseconds
     */
    const addToast = useCallback((message, variant = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, variant }]);

        // Schedule automatic removal
        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, [removeToast]);

    /**
     * Context value containing toast action methods.
     * @type {ToastContextValue}
     */
    const value = {
        /**
         * Show a success toast (green, checkmark icon).
         * @param {string} message - Success message
         */
        success: (message) => addToast(message, 'success'),

        /**
         * Show an error toast (red, X icon).
         * @param {string} message - Error message
         */
        error: (message) => addToast(message, 'error'),

        /**
         * Show a warning toast (amber, warning icon).
         * @param {string} message - Warning message
         */
        warning: (message) => addToast(message, 'warning'),

        /**
         * Show an info toast (blue, info icon).
         * @param {string} message - Info message
         */
        info: (message) => addToast(message, 'info'),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Toast Container - Fixed position bottom-right */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => {
                    const Icon = TOAST_ICONS[toast.variant];
                    const styles = TOAST_STYLES[toast.variant];

                    return (
                        <div
                            key={toast.id}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl border
                                backdrop-blur-xl shadow-2xl min-w-[280px] max-w-sm
                                animate-slide-up ${styles}
                            `}
                        >
                            {/* Toast Icon */}
                            <Icon className="w-5 h-5 flex-shrink-0" />

                            {/* Toast Message */}
                            <p className="flex-1 text-sm font-medium text-white">
                                {toast.message}
                            </p>

                            {/* Dismiss Button */}
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastContext;
