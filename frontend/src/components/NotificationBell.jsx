/**
 * TaskBuddy - Notification Bell Component
 * 
 * A notification bell button with dropdown menu displaying
 * pending notifications. Includes badge count and permission
 * request for browser push notifications.
 * 
 * Features:
 * - Badge showing notification count
 * - Dropdown menu with notification list
 * - Notification type icons and styling
 * - Individual notification dismissal
 * - Browser push notification permission request
 * - Click outside to close dropdown
 * 
 * @module components/NotificationBell
 * @version 2.0.0
 */

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, X, AlertTriangle, Clock, Flame, CheckCircle } from 'lucide-react';

/**
 * Icon components mapped by notification type.
 * @constant {Object.<string, React.Component>}
 */
const notificationIcons = {
    overdue: AlertTriangle,
    due_today: Clock,
    reminder: Bell,
    streak: Flame,
};

/**
 * Styling classes mapped by notification type.
 * Includes text color and background color.
 * @constant {Object.<string, string>}
 */
const notificationColors = {
    overdue: 'text-red-400 bg-red-500/20',
    due_today: 'text-amber-400 bg-amber-500/20',
    reminder: 'text-indigo-400 bg-indigo-500/20',
    streak: 'text-orange-400 bg-orange-500/20',
};

/**
 * Notification Bell component with dropdown menu.
 * 
 * Displays a bell icon with notification count badge.
 * Clicking reveals a dropdown with all pending notifications.
 * 
 * @component
 * @returns {JSX.Element} Notification bell with dropdown
 * 
 * @example
 * // In Sidebar or Header
 * <NotificationBell />
 */
const NotificationBell = () => {
    // ========================================================================
    // CONTEXT & STATE
    // ========================================================================

    const {
        notifications,
        notificationCount,
        dismissNotification,
        requestPermission,
        permission
    } = useNotifications();

    /** Whether the dropdown menu is open */
    const [isOpen, setIsOpen] = useState(false);

    /** Reference to dropdown for click-outside detection */
    const dropdownRef = useRef(null);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    /**
     * Close dropdown when clicking outside.
     */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /**
     * Request browser notification permission.
     */
    const handleEnableNotifications = async () => {
        await requestPermission();
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                aria-label={`Notifications (${notificationCount} pending)`}
            >
                <Bell className="w-5 h-5 text-slate-300" />

                {/* Notification Count Badge */}
                {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
                        {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="fixed inset-x-4 top-20 md:absolute md:inset-x-auto md:left-0 md:top-auto md:mt-2 w-auto md:w-80 rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-white">Notifications</h3>
                            {notificationCount > 0 && (
                                <span className="text-xs text-slate-400">{notificationCount} pending</span>
                            )}
                        </div>

                        {/* Push Notification Permission Banner */}
                        {permission !== 'granted' && (
                            <button
                                onClick={handleEnableNotifications}
                                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 hover:text-indigo-300 transition-all text-sm font-medium"
                            >
                                <Bell className="w-4 h-4" />
                                Enable Push Notifications
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            // Empty State
                            <div className="p-6 text-center">
                                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                                <p className="text-slate-400">All caught up!</p>
                                <p className="text-slate-500 text-sm">No pending notifications</p>
                            </div>
                        ) : (
                            // Notification Items
                            notifications.map((notification) => {
                                const Icon = notificationIcons[notification.type] || Bell;
                                const colorClass = notificationColors[notification.type] || 'text-slate-400 bg-slate-500/20';

                                return (
                                    <div
                                        key={notification.id}
                                        className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex gap-3">
                                            {/* Notification Icon */}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>

                                            {/* Notification Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white text-sm">
                                                    {notification.title}
                                                </p>
                                                <p className="text-slate-400 text-sm line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            </div>

                                            {/* Dismiss Button */}
                                            <button
                                                onClick={() => dismissNotification(notification.id)}
                                                className="p-1 rounded-lg hover:bg-white/10 transition-colors text-slate-500 hover:text-slate-300 flex-shrink-0"
                                                aria-label="Dismiss notification"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-white/10">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
