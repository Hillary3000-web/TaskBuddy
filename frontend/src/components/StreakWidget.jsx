/**
 * TaskBuddy - Streak Widget Component
 * 
 * A dashboard widget displaying the user's current check-in streak
 * with a weekly calendar view and check-in button.
 * 
 * Features:
 * - Large streak counter display
 * - Motivational messages based on streak length
 * - 7-day calendar showing check-in history
 * - Check-in button with loading and success states
 * - Animated fire icon for active streaks
 * - Gradient background with glow effects
 * 
 * @module components/StreakWidget
 * @version 2.0.0
 */

import { Flame, Loader2, Check } from 'lucide-react';

/**
 * Get motivational message based on streak length.
 * 
 * @param {number} streak - Current streak count
 * @returns {string} Motivational message
 */
const getMessage = (streak) => {
    if (streak === 0) return "Start your streak today!";
    if (streak < 3) return "Great start! Keep going!";
    if (streak < 7) return "You're on fire! 🔥";
    if (streak < 14) return "Incredible consistency!";
    if (streak < 30) return "You're unstoppable!";
    return "Legendary streak! 🏆";
};

/**
 * Generate array of last 7 days with check-in status.
 * 
 * @param {string[]} weeklyCheckIns - Array of ISO date strings of check-ins
 * @param {boolean} checkedInToday - Whether user checked in today
 * @returns {Array<{date: string, day: string, isToday: boolean, checkedIn: boolean}>}
 */
const getLast7Days = (weeklyCheckIns = [], checkedInToday = false) => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
        days.push({
            date: dateStr,
            day: dayName,
            isToday: i === 0,
            checkedIn: weeklyCheckIns.includes(dateStr) || (i === 0 && checkedInToday)
        });
    }

    return days;
};

/**
 * Streak Widget component for displaying user's check-in streak.
 * 
 * Shows the current streak count, a weekly calendar with check-in
 * history, and a button to record today's check-in.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {number} props.streak - Current consecutive day streak
 * @param {boolean} props.checkedInToday - Whether user has checked in today
 * @param {boolean} props.isLoading - Whether check-in is in progress
 * @param {Function} props.onCheckIn - Callback when check-in button is clicked
 * @param {string[]} [props.weeklyCheckIns=[]] - Array of check-in dates (ISO format)
 * @returns {JSX.Element} Streak widget component
 * 
 * @example
 * <StreakWidget 
 *   streak={7}
 *   checkedInToday={false}
 *   isLoading={false}
 *   onCheckIn={handleCheckIn}
 *   weeklyCheckIns={['2024-12-10', '2024-12-11', '2024-12-12']}
 * />
 */
const StreakWidget = ({ streak, checkedInToday, isLoading, onCheckIn, weeklyCheckIns = [] }) => {
    const days = getLast7Days(weeklyCheckIns, checkedInToday);

    return (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 relative overflow-hidden">
            {/* Decorative Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl" />

            <div className="relative">
                {/* Header with Fire Icon */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${streak > 0 ? 'bg-orange-500/20' : 'bg-slate-700/50'}`}>
                            <Flame
                                className={`w-5 h-5 ${streak > 0 ? 'text-orange-400 animate-pulse' : 'text-slate-500'}`}
                            />
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Current Streak</span>
                    </div>
                </div>

                {/* Streak Counter */}
                <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-white">{streak}</span>
                        <span className="text-slate-400 text-lg">days</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{getMessage(streak)}</p>
                </div>

                {/* Weekly Calendar Grid */}
                <div className="flex justify-between mb-4" role="group" aria-label="Weekly check-in calendar">
                    {days.map((day, index) => (
                        <div
                            key={index}
                            className={`flex flex-col items-center gap-1 ${day.isToday ? 'scale-110' : ''}`}
                        >
                            {/* Day Label */}
                            <span
                                className={`text-xs font-medium ${day.isToday ? 'text-indigo-400' : 'text-slate-500'}`}
                            >
                                {day.day}
                            </span>

                            {/* Day Circle */}
                            <div
                                className={`
                                    w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                                    ${day.checkedIn
                                        ? 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg shadow-orange-500/30'
                                        : day.isToday
                                            ? 'bg-slate-700 border-2 border-indigo-500/50'
                                            : 'bg-slate-700/50'
                                    }
                                `}
                                aria-label={`${day.date} - ${day.checkedIn ? 'checked in' : 'not checked in'}`}
                            >
                                {day.checkedIn && (
                                    <Check className="w-4 h-4 text-white" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Check-In Button */}
                <button
                    onClick={onCheckIn}
                    disabled={checkedInToday || isLoading}
                    className={`
                        w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 
                        flex items-center justify-center gap-2
                        ${checkedInToday
                            ? 'bg-emerald-500/20 text-emerald-400 cursor-default border border-emerald-500/30'
                            : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50'
                        }
                        disabled:opacity-70 disabled:cursor-not-allowed
                    `}
                    aria-label={checkedInToday ? 'Already checked in today' : 'Check in to maintain streak'}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Checking in...
                        </>
                    ) : checkedInToday ? (
                        <>
                            <Check className="w-5 h-5" />
                            Checked in today!
                        </>
                    ) : (
                        <>
                            <Flame className="w-5 h-5" />
                            Check In
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default StreakWidget;
