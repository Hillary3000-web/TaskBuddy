/**
 * TaskBuddy - Timer (Focus Mode) Context
 * 
 * Manages the global state for the Pomodoro timer.
 * Uses a delta-time approach (Date.now()) for accurate tracking
 * even if the tab is backgrounded.
 * 
 * @module context/TimerContext
 */

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNotifications } from './NotificationContext';
import { useToast } from './ToastContext';

const TimerContext = createContext(null);

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
};

// Timer modes in minutes
const MODES = {
    focus: 25,
    shortBreak: 5,
    longBreak: 15
};

export const TimerProvider = ({ children }) => {
    const { permission, requestPermission } = useNotifications();
    const toast = useToast();

    // State
    const [mode, setMode] = useState('focus'); // 'focus' | 'shortBreak' | 'longBreak'
    const [timeLeft, setTimeLeft] = useState(MODES.focus * 60);
    const [isActive, setIsActive] = useState(false);
    const [task, setTask] = useState(null); // The task currently being focused on (optional)
    const [isMinimized, setIsMinimized] = useState(false); // Controls overlay visibility

    // Refs for accurate timing
    const intervalRef = useRef(null);
    const endTimeRef = useRef(null);

    // Initial setup request permission if needed
    useEffect(() => {
        if (isActive && permission !== 'granted') {
            requestPermission();
        }
    }, [isActive, permission]);

    // Timer Logic
    useEffect(() => {
        if (isActive) {
            // If just starting (or resuming), calculate expected end time
            if (!endTimeRef.current) {
                endTimeRef.current = Date.now() + timeLeft * 1000;
            }

            intervalRef.current = setInterval(() => {
                const now = Date.now();
                const remaining = Math.ceil((endTimeRef.current - now) / 1000);

                if (remaining <= 0) {
                    // Timer Finished
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    endTimeRef.current = null;
                    setIsActive(false);
                    setTimeLeft(0);
                    handleTimerComplete();
                } else {
                    setTimeLeft(remaining);
                }
            }, 100); // Check every 100ms for smoothness
        } else {
            // Paused
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                // When pausing, we clear endTime so resuming will recalculate based on timeLeft
                endTimeRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive]);

    const handleTimerComplete = () => {
        // Show notification
        if (permission === 'granted') {
            new Notification('TaskBuddy', {
                body: mode === 'focus' ? 'Focus session complete! Take a break.' : 'Break is over! Ready to focus?',
                icon: '/icon-192x192.png' // Assuming standard PWA icon exists or default
            });
        }

        toast.success(mode === 'focus' ? 'Focus session complete! 🎉' : 'Break finished! 🚀');

        // Optional: Auto-switch modes or waiting for user?
        // Let's reset to default of the same mode for now, or auto-switch
        setIsMinimized(false); // maximization to show result
    };

    // Actions
    const startTimer = (specificTask = null) => {
        if (specificTask) setTask(specificTask);
        setIsActive(true);
        setIsMinimized(false); // Auto maximize on start
    };

    const pauseTimer = () => {
        setIsActive(false);
        // timeLeft needs to generally stay handled by state
    };

    const stopTimer = () => {
        setIsActive(false);
        setTimeLeft(MODES[mode] * 60);
        setTask(null);
        endTimeRef.current = null;
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(MODES[newMode] * 60);
        endTimeRef.current = null;
    };

    const toggleMinimize = () => setIsMinimized(!isMinimized);

    // Helpers
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' + secs : secs}`;
    };

    const value = {
        mode,
        timeLeft,
        isActive,
        task,
        isMinimized,
        startTimer,
        pauseTimer,
        stopTimer,
        switchMode,
        toggleMinimize,
        formatTime,
        MODES
    };

    return (
        <TimerContext.Provider value={value}>
            {children}
        </TimerContext.Provider>
    );
};

export default TimerContext;
