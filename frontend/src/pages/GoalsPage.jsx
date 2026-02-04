import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import { Target, Trophy, TrendingUp, Calendar, Plus, Loader2, Check, X } from 'lucide-react';

const GoalsPage = () => {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [goals, setGoals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddGoal, setShowAddGoal] = useState(false);
    const [newGoal, setNewGoal] = useState({ title: '', target: 5, period: 'weekly' });

    // For now, we'll use localStorage to store goals
    // In a full implementation, this would be a backend API
    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = () => {
        setIsLoading(true);
        try {
            const savedGoals = localStorage.getItem('taskbuddy_goals');
            if (savedGoals) {
                setGoals(JSON.parse(savedGoals));
            } else {
                // Default goals
                setGoals([
                    { id: 1, title: 'Complete Tasks', target: 5, current: 0, period: 'daily' },
                    { id: 2, title: 'Maintain Streak', target: 7, current: 0, period: 'weekly' },
                ]);
            }
        } catch (error) {
            console.error('Failed to load goals:', error);
        }
        setIsLoading(false);
    };

    const saveGoals = (updatedGoals) => {
        localStorage.setItem('taskbuddy_goals', JSON.stringify(updatedGoals));
        setGoals(updatedGoals);
    };

    const addGoal = () => {
        if (!newGoal.title.trim()) return;

        const goal = {
            id: Date.now(),
            title: newGoal.title,
            target: newGoal.target,
            current: 0,
            period: newGoal.period
        };

        saveGoals([...goals, goal]);
        setNewGoal({ title: '', target: 5, period: 'weekly' });
        setShowAddGoal(false);
    };

    const updateGoalProgress = (goalId, increment) => {
        const updatedGoals = goals.map(goal => {
            if (goal.id === goalId) {
                const newCurrent = Math.max(0, Math.min(goal.target, goal.current + increment));
                return { ...goal, current: newCurrent };
            }
            return goal;
        });
        saveGoals(updatedGoals);
    };

    const deleteGoal = (goalId) => {
        saveGoals(goals.filter(g => g.id !== goalId));
    };

    const getProgressPercentage = (current, target) => {
        return Math.min(100, Math.round((current / target) * 100));
    };

    const periodLabels = {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly'
    };

    return (
        <div className="min-h-screen bg-slate-900 flex">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                {/* Header */}
                <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-10">
                    <div className="px-4 md:px-8 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-white">Goals</h1>
                            <p className="text-slate-400 text-sm mt-1">Track your productivity goals</p>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </header>

                <div className="p-4 md:p-8">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <Target className="w-5 h-5 text-indigo-400" />
                                </div>
                                <span className="text-slate-400 text-sm">Active Goals</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{goals.length}</p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <Trophy className="w-5 h-5 text-emerald-400" />
                                </div>
                                <span className="text-slate-400 text-sm">Completed</span>
                            </div>
                            <p className="text-3xl font-bold text-white">
                                {goals.filter(g => g.current >= g.target).length}
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-amber-400" />
                                </div>
                                <span className="text-slate-400 text-sm">In Progress</span>
                            </div>
                            <p className="text-3xl font-bold text-white">
                                {goals.filter(g => g.current > 0 && g.current < g.target).length}
                            </p>
                        </div>
                    </div>

                    {/* Goals List */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Your Goals</h2>
                            <button
                                onClick={() => setShowAddGoal(true)}
                                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add Goal</span>
                            </button>
                        </div>

                        {/* Add Goal Form */}
                        {showAddGoal && (
                            <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <input
                                        type="text"
                                        value={newGoal.title}
                                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                        placeholder="Goal title"
                                        className="md:col-span-2 bg-slate-900/50 border border-slate-600 rounded-xl py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="number"
                                        value={newGoal.target}
                                        onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) || 1 })}
                                        min="1"
                                        className="bg-slate-900/50 border border-slate-600 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <select
                                        value={newGoal.period}
                                        onChange={(e) => setNewGoal({ ...newGoal, period: e.target.value })}
                                        className="bg-slate-900/50 border border-slate-600 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={addGoal}
                                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setShowAddGoal(false)}
                                        className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-xl transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                            </div>
                        ) : goals.length > 0 ? (
                            <div className="space-y-4">
                                {goals.map((goal) => {
                                    const percentage = getProgressPercentage(goal.current, goal.target);
                                    const isCompleted = goal.current >= goal.target;

                                    return (
                                        <div
                                            key={goal.id}
                                            className={`group bg-slate-700/30 border rounded-xl p-4 transition-all ${isCompleted
                                                ? 'border-emerald-500/30 bg-emerald-500/5'
                                                : 'border-slate-600/50 hover:border-slate-500/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${isCompleted ? 'bg-emerald-500/20' : 'bg-indigo-500/20'}`}>
                                                        {isCompleted ? (
                                                            <Trophy className="w-5 h-5 text-emerald-400" />
                                                        ) : (
                                                            <Target className="w-5 h-5 text-indigo-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className={`font-medium ${isCompleted ? 'text-emerald-300' : 'text-white'}`}>
                                                            {goal.title}
                                                        </h3>
                                                        <span className="text-xs text-slate-500">{periodLabels[goal.period]}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateGoalProgress(goal.id, -1)}
                                                        disabled={goal.current === 0}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        <span className="text-lg font-bold">−</span>
                                                    </button>
                                                    <span className="text-white font-semibold min-w-[60px] text-center">
                                                        {goal.current} / {goal.target}
                                                    </span>
                                                    <button
                                                        onClick={() => updateGoalProgress(goal.id, 1)}
                                                        disabled={goal.current >= goal.target}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        <span className="text-lg font-bold">+</span>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteGoal(goal.id)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all ml-2"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-2 bg-slate-600/50 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isCompleted
                                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                                        : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                                                        }`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <p className="text-right text-xs text-slate-500 mt-1">{percentage}% complete</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Target className="w-8 h-8 text-slate-500" />
                                </div>
                                <p className="text-slate-400 mb-4">No goals set yet. Create your first goal!</p>
                                <button
                                    onClick={() => setShowAddGoal(true)}
                                    className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Goal
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GoalsPage;
