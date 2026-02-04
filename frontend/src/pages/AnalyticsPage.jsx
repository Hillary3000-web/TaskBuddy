import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
    TrendingUp, CheckCircle2, Clock, Target, Flame,
    Calendar, Award, BarChart3, Loader2
} from 'lucide-react';

const PRIORITY_COLORS = {
    high: '#ef4444',
    medium: '#f97316',
    low: '#22c55e'
};

const AnalyticsPage = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/analytics/');
            setAnalytics(response.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            toast.error('Failed to load analytics');
        }
        setIsLoading(false);
    };

    // Prepare pie chart data
    const priorityData = analytics ? [
        { name: 'High', value: analytics.tasksByPriority.high, color: PRIORITY_COLORS.high },
        { name: 'Medium', value: analytics.tasksByPriority.medium, color: PRIORITY_COLORS.medium },
        { name: 'Low', value: analytics.tasksByPriority.low, color: PRIORITY_COLORS.low },
    ].filter(d => d.value > 0) : [];

    return (
        <div className="flex bg-transparent">
            <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
                <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Analytics</h1>
                            <p className="text-sm lg:text-base text-slate-400">Track your productivity and progress</p>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
                        >
                            <BarChart3 className="w-6 h-6" />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : analytics ? (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <StatCard
                                    icon={Target}
                                    label="Total Tasks"
                                    value={analytics.totalTasks}
                                    color="indigo"
                                />
                                <StatCard
                                    icon={CheckCircle2}
                                    label="Completed"
                                    value={analytics.completedTasks}
                                    color="emerald"
                                />
                                <StatCard
                                    icon={Clock}
                                    label="Pending"
                                    value={analytics.pendingTasks}
                                    color="amber"
                                />
                                <StatCard
                                    icon={TrendingUp}
                                    label="Completion Rate"
                                    value={`${analytics.completionRate}%`}
                                    color="purple"
                                />
                            </div>

                            {/* Streak Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="glass-card p-6 flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                                        <Flame className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-sm">Current Streak</p>
                                        <p className="text-3xl font-bold text-white">{analytics.currentStreak} days</p>
                                    </div>
                                </div>
                                <div className="glass-card p-6 flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                                        <Award className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-sm">Longest Streak</p>
                                        <p className="text-3xl font-bold text-white">{analytics.longestStreak} days</p>
                                    </div>
                                </div>
                                <div className="glass-card p-6 flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                        <Calendar className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-sm">This Week</p>
                                        <p className="text-3xl font-bold text-white">{analytics.tasksCompletedThisWeek} tasks</p>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Weekly Progress Chart */}
                                <div className="glass-card p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                                        Weekly Progress
                                    </h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analytics.weeklyProgress}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis dataKey="day" stroke="#94a3b8" />
                                                <YAxis stroke="#94a3b8" allowDecimals={false} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#1e293b',
                                                        border: '1px solid #334155',
                                                        borderRadius: '8px'
                                                    }}
                                                    labelStyle={{ color: '#f1f5f9' }}
                                                />
                                                <Bar
                                                    dataKey="completed"
                                                    fill="url(#colorGradient)"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                                <defs>
                                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#6366f1" />
                                                        <stop offset="100%" stopColor="#8b5cf6" />
                                                    </linearGradient>
                                                </defs>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Priority Distribution */}
                                <div className="glass-card p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        Tasks by Priority
                                    </h3>
                                    <div className="h-64">
                                        {priorityData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={priorityData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={90}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {priorityData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: '#1e293b',
                                                            border: '1px solid #334155',
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-slate-500">
                                                No tasks yet
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Check-in Heatmap */}
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-orange-400" />
                                    Check-in History (Last 30 Days)
                                </h3>
                                <div className="flex flex-wrap gap-1">
                                    {analytics.checkInHistory.map((day, index) => (
                                        <div
                                            key={index}
                                            title={day.date}
                                            className={`w-6 h-6 rounded-sm ${day.checkedIn
                                                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                                                : 'bg-slate-700/50'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-sm bg-slate-700/50" />
                                        <span>No check-in</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-emerald-500 to-emerald-600" />
                                        <span>Checked in</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </main>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colorClasses = {
        indigo: 'from-indigo-500 to-indigo-600',
        emerald: 'from-emerald-500 to-emerald-600',
        amber: 'from-amber-500 to-amber-600',
        purple: 'from-purple-500 to-purple-600',
    };

    return (
        <div className="glass-card p-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-400 text-sm">{label}</p>
        </div>
    );
};

export default AnalyticsPage;
