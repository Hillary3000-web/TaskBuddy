
import { useEffect, useState } from 'react';
import { useTimer } from '../context/TimerContext';
import {
    Play, Pause, X, Minus, Maximize2,
    Coffee, Brain, Battery
} from 'lucide-react';

const FocusOverlay = () => {
    const {
        mode, timeLeft, isActive, task, isMinimized,
        startTimer, pauseTimer, stopTimer, toggleMinimize,
        formatTime, switchMode, MODES
    } = useTimer();

    // Calculate progress for circle (0 to 1 calculation for stroke)
    const totalTime = MODES[mode] * 60;
    const progress = (timeLeft / totalTime) * 100;
    const strokeDasharray = 283; // 2 * PI * r (r=45)
    const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray;

    // Render nothing if timer is stopped and no task is active
    // EXCEPT if we are manually starting a session without a task... 
    // Actually, timer should only show if (isActive || timeLeft < totalTime) OR if explicitly opened.
    // For now, let's assume if it is NOT active and Time is FULL, we don't show overlay unless hidden state says otherwise.
    // But we need a way to open it initially. 
    // Let's rely on dashboard button to set isActive=true or some "showOverlay" state. 
    // Since our context sets isActive=true on start, we use that.
    // Also show if paused (isActive=false but timeLeft < totalTime).

    // Better logic: Show if internal "isOpen" state is true? 
    // Or just check if timeLeft != totalTime OR isActive.
    // But user might want to stop completely. stopTimer resets everything. 
    // So if isActive is false AND timeLeft == totalTime, we assume it's closed.

    const isOverlayVisible = isActive || (timeLeft < totalTime && timeLeft > 0);

    if (!isOverlayVisible) return null;

    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-bottom duration-300">
                <div className="bg-slate-800/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4 w-72">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        {/* Mini Circular Progress */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="24" cy="24" r="20"
                                stroke="currentColor" strokeWidth="4"
                                fill="transparent"
                                className="text-slate-700"
                            />
                            <circle
                                cx="24" cy="24" r="20"
                                stroke="currentColor" strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={126}
                                strokeDashoffset={126 - (progress / 100) * 126}
                                className={`${isActive ? 'text-indigo-500' : 'text-slate-500'} transition-all duration-1000 ease-linear`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            {isActive ? (
                                <button onClick={pauseTimer} className="text-white hover:text-indigo-400">
                                    <Pause className="w-4 h-4" />
                                </button>
                            ) : (
                                <button onClick={() => startTimer()} className="text-white hover:text-indigo-400">
                                    <Play className="w-4 h-4 ml-0.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-xl font-mono font-bold text-white leading-none mb-1">
                            {formatTime(timeLeft)}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                            {mode === 'focus' ? (task?.title || 'Focus Session') : 'Break Time'}
                        </p>
                    </div>

                    <button
                        onClick={toggleMinimize}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <Maximize2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
            {/* Header Controls */}
            <div className="absolute top-6 right-6 flex items-center gap-4">
                <button
                    onClick={toggleMinimize}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all backdrop-blur-lg"
                    title="Minimize"
                >
                    <Minus className="w-6 h-6" />
                </button>
                <button
                    onClick={stopTimer}
                    className="p-3 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all backdrop-blur-lg"
                    title="Close Session"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-md px-6 text-center">
                {/* Mode Selector */}
                <div className="flex items-center justify-center gap-2 mb-12 bg-white/5 p-1.5 rounded-full w-fit mx-auto">
                    {[
                        { id: 'focus', label: 'Focus', icon: Brain },
                        { id: 'shortBreak', label: 'Short Break', icon: Coffee },
                        { id: 'longBreak', label: 'Long Break', icon: Battery },
                    ].map((m) => (
                        <button
                            key={m.id}
                            onClick={() => switchMode(m.id)}
                            className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all ${mode === m.id
                                    ? 'bg-indigo-500 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <m.icon className="w-4 h-4" />
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* Progress Circle & Time */}
                <div className="relative w-80 h-80 mx-auto mb-12">
                    {/* Pulsing Effect Background */}
                    {isActive && (
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
                    )}

                    <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                        {/* Background Track */}
                        <circle
                            cx="160" cy="160" r="135"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="8"
                            fill="transparent"
                        />
                        {/* Progress Line */}
                        <circle
                            cx="160" cy="160" r="135"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={848} // 2 * PI * 135
                            strokeDashoffset={848 - (progress / 100) * 848}
                            className={`${mode === 'focus' ? 'text-indigo-500' : 'text-emerald-500'
                                } transition-all duration-1000 ease-linear`}
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Centered Time Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-7xl font-mono font-bold text-white tracking-tighter tabular-nums drop-shadow-lg">
                            {formatTime(timeLeft)}
                        </span>
                        <p className="text-slate-400 mt-4 max-w-[200px] truncate px-4 font-medium">
                            {mode === 'focus' ? (
                                <>
                                    <span className="opacity-50">Focusing on:</span><br />
                                    <span className="text-white">{task ? task.title : 'Deep Work'}</span>
                                </>
                            ) : 'Time to recharge'}
                        </p>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-center gap-6">
                    {isActive ? (
                        <button
                            onClick={pauseTimer}
                            className="bg-white/10 hover:bg-white/20 text-white rounded-2xl p-6 transition-all hover:scale-105 active:scale-95 border border-white/5"
                        >
                            <Pause className="w-8 h-8 fill-current" />
                        </button>
                    ) : (
                        <button
                            onClick={() => startTimer()}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl p-6 shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95"
                        >
                            <Play className="w-8 h-8 fill-current ml-1" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FocusOverlay;
