/**
 * TaskBuddy - Notification Permission Modal
 * 
 * A professional modal that prompts users to enable browser
 * push notifications. Shown on first login/registration.
 * 
 * @module components/NotificationPermissionModal
 * @version 1.0.0
 */

import { Bell, X, BellRing } from 'lucide-react';

/**
 * Modal for requesting browser notification permission.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onEnable - Callback when user enables notifications
 * @returns {JSX.Element|null} Modal component or null if closed
 */
const NotificationPermissionModal = ({ isOpen, onClose, onEnable }) => {
    if (!isOpen) return null;

    const handleEnable = async () => {
        await onEnable();
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with animated bell */}
                    <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-center">
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Animated bell icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
                            <BellRing className="w-10 h-10 text-white animate-bounce" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">
                            Stay Updated!
                        </h2>
                        <p className="text-indigo-100">
                            Never miss important task reminders
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Bell className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white text-sm">Task Reminders</p>
                                    <p className="text-slate-400 text-sm">Get notified when tasks are due</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Bell className="w-4 h-4 text-amber-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white text-sm">Overdue Alerts</p>
                                    <p className="text-slate-400 text-sm">Don't let tasks slip through</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Bell className="w-4 h-4 text-orange-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white text-sm">Streak Reminders</p>
                                    <p className="text-slate-400 text-sm">Keep your productivity streak alive</p>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-colors font-medium"
                            >
                                Maybe Later
                            </button>
                            <button
                                onClick={handleEnable}
                                className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/30 transition-all"
                            >
                                Enable Notifications
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NotificationPermissionModal;
