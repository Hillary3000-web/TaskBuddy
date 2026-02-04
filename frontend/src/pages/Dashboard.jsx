/**
 * TaskBuddy - Dashboard Page
 * 
 * The main dashboard page displaying user overview including
 * streak widget, task statistics, and task list.
 * 
 * Features:
 * - Personalized greeting based on time of day
 * - Streak widget with check-in functionality
 * - Task statistics cards (completed, pending, total)
 * - Full task list with CRUD operations
 * - Add task modal integration
 * - Responsive sidebar layout
 * 
 * @module pages/Dashboard
 * @version 2.0.0
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import { useTimer } from '../context/TimerContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import StreakWidget from '../components/StreakWidget';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
import NotificationPermissionModal from '../components/NotificationPermissionModal';
import { Plus, CheckCircle2, Clock, Target, Loader2, Brain } from 'lucide-react';

/**
 * Dashboard page component.
 * 
 * Main authenticated user dashboard with task management,
 * streak tracking, and productivity statistics.
 * 
 * @component
 * @returns {JSX.Element} Dashboard page
 */
const Dashboard = () => {
    // ========================================================================
    // CONTEXT & STATE
    // ========================================================================

    const { user } = useAuth();
    const toast = useToast();
    const { permission, requestPermission } = useNotifications();
    const { startTimer } = useTimer();

    /** Current streak count */
    const [streak, setStreak] = useState(0);

    /** Whether user has checked in today */
    const [checkedInToday, setCheckedInToday] = useState(false);

    /** Check-in operation loading state */
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    /** User's task list */
    const [tasks, setTasks] = useState([]);

    /** Tasks loading state */
    const [isLoadingTasks, setIsLoadingTasks] = useState(true);

    /** Sidebar visibility (for mobile) */
    const [sidebarOpen, setSidebarOpen] = useState(true);

    /** Weekly check-in dates for calendar display */
    const [weeklyCheckIns, setWeeklyCheckIns] = useState([]);

    /** Add task modal visibility */
    const [isModalOpen, setIsModalOpen] = useState(false);

    /** Task creation loading state */
    const [isAddingTask, setIsAddingTask] = useState(false);

    /** Notification permission modal visibility */
    const [showNotificationModal, setShowNotificationModal] = useState(false);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    /**
     * Fetch dashboard data on component mount.
     */
    useEffect(() => {
        fetchDashboardData();
    }, []);

    /**
     * Show notification permission modal on first login if not granted.
     */
    useEffect(() => {
        // Check if we should show the notification modal
        const hasSeenModal = localStorage.getItem('taskbuddy_notification_modal_shown');

        if (!hasSeenModal && permission !== 'granted') {
            // Small delay to let the dashboard load first
            const timer = setTimeout(() => {
                setShowNotificationModal(true);
                localStorage.setItem('taskbuddy_notification_modal_shown', 'true');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [permission]);

    // ========================================================================
    // DATA FETCHING
    // ========================================================================

    /**
     * Fetch all dashboard data (streak and tasks).
     * @async
     */
    const fetchDashboardData = async () => {
        setIsLoadingTasks(true);

        // Fetch streak data
        try {
            const streakResponse = await api.get('/streak/');
            setStreak(streakResponse.data.current_streak || 0);
            setCheckedInToday(streakResponse.data.checked_in_today || false);
            setWeeklyCheckIns(streakResponse.data.weekly_check_ins || []);
        } catch (error) {
            console.error('Failed to fetch streak:', error);
        }

        // Fetch tasks
        try {
            const tasksResponse = await api.get('/tasks/');
            setTasks(tasksResponse.data || []);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        }

        setIsLoadingTasks(false);
    };

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /**
     * Handle daily check-in action.
     * Records check-in and updates streak.
     * @async
     */
    const handleCheckIn = async () => {
        if (checkedInToday || isCheckingIn) return;

        setIsCheckingIn(true);
        try {
            const response = await api.post('/check-in/');
            setStreak(response.data.streak || streak + 1);
            setCheckedInToday(true);
            // Update weekly check-ins
            const today = new Date().toISOString().split('T')[0];
            setWeeklyCheckIns(prev => [...prev, today]);
            toast.success('🔥 Checked in! Keep the streak going!');
        } catch (error) {
            console.error('Check-in failed:', error);
            toast.error('Check-in failed. Please try again.');
        }
        setIsCheckingIn(false);
    };

    /**
     * Handle new task creation.
     * @async
     * @param {Object} taskData - New task data from modal
     */
    const handleAddTask = async (taskData) => {
        setIsAddingTask(true);
        try {
            const response = await api.post('/tasks/', taskData);
            setTasks([response.data, ...tasks]);
            setIsModalOpen(false);
            toast.success('Task added successfully!');
        } catch (error) {
            console.error('Failed to add task:', error);
            toast.error('Failed to add task. Please try again.');
        }
        setIsAddingTask(false);
    };

    /**
     * Toggle task completion status.
     * @async
     * @param {number} taskId - ID of task to toggle
     */
    const toggleTaskComplete = async (taskId) => {
        try {
            const response = await api.patch(`/tasks/${taskId}/toggle/`);
            setTasks(tasks.map(task =>
                task.id === taskId ? response.data : task
            ));
            const isCompleted = response.data.completed;
            toast.success(isCompleted ? '✓ Task completed!' : 'Task marked as pending');
        } catch (error) {
            console.error('Failed to toggle task:', error);
            toast.error('Failed to update task.');
        }
    };

    /**
     * Delete a task.
     * @async
     * @param {number} taskId - ID of task to delete
     */
    const deleteTask = async (taskId) => {
        try {
            await api.delete(`/tasks/${taskId}/`);
            setTasks(tasks.filter(task => task.id !== taskId));
            toast.success('Task deleted');
        } catch (error) {
            console.error('Failed to delete task:', error);
            toast.error('Failed to delete task.');
        }
    };

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    /** Count of completed tasks */
    const completedTasks = tasks.filter(t => t.completed).length;

    /** Count of pending tasks */
    const pendingTasks = tasks.filter(t => !t.completed).length;

    /**
     * Get greeting based on current time of day.
     * @returns {string} 'Morning', 'Afternoon', or 'Evening'
     */
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Morning';
        if (hour < 18) return 'Afternoon';
        return 'Evening';
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="flex bg-transparent">
            {/* Sidebar Navigation */}
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main Content Area */}
            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                {/* Top Header Bar */}
                <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-10">
                    <div className="px-4 md:px-8 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-white">
                                Good {getGreeting()}, {user?.username || 'Buddy'}! 👋
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">Let's make today productive</p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Start Focus Button */}
                            <button
                                onClick={() => startTimer()}
                                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
                            >
                                <Brain className="w-4 h-4" />
                                <span className="hidden sm:inline">Start Focus</span>
                                <span className="sm:hidden">Focus</span>
                            </button>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="md:hidden p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                                aria-label="Toggle sidebar"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8">
                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {/* Streak Widget */}
                        <div className="col-span-2 lg:col-span-1">
                            <StreakWidget
                                streak={streak}
                                checkedInToday={checkedInToday}
                                isLoading={isCheckingIn}
                                onCheckIn={handleCheckIn}
                                weeklyCheckIns={weeklyCheckIns}
                            />
                        </div>

                        {/* Completed Tasks Card */}
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                </div>
                                <span className="text-slate-400 text-sm">Completed</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{completedTasks}</p>
                            <p className="text-slate-500 text-sm mt-1">tasks done</p>
                        </div>

                        {/* Pending Tasks Card */}
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <Clock className="w-5 h-5 text-amber-400" />
                                </div>
                                <span className="text-slate-400 text-sm">Pending</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{pendingTasks}</p>
                            <p className="text-slate-500 text-sm mt-1">in progress</p>
                        </div>

                        {/* Total Tasks Card */}
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <Target className="w-5 h-5 text-indigo-400" />
                                </div>
                                <span className="text-slate-400 text-sm">Total</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{tasks.length}</p>
                            <p className="text-slate-500 text-sm mt-1">all tasks</p>
                        </div>
                    </div>

                    {/* Tasks Section */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Your Tasks</h2>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add Task</span>
                            </button>
                        </div>

                        {/* Task List */}
                        {isLoadingTasks ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                            </div>
                        ) : tasks.length > 0 ? (
                            <div className="space-y-4">
                                {tasks.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onToggle={() => toggleTaskComplete(task.id)}
                                        onDelete={() => deleteTask(task.id)}
                                        onFocus={() => startTimer(task)}
                                    />
                                ))}
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-slate-500" />
                                </div>
                                <p className="text-slate-400 mb-4">No tasks yet. Add your first task!</p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Task
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Add Task Modal */}
            <AddTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddTask}
                isLoading={isAddingTask}
            />

            {/* Notification Permission Modal */}
            <NotificationPermissionModal
                isOpen={showNotificationModal}
                onClose={() => setShowNotificationModal(false)}
                onEnable={requestPermission}
            />
        </div>
    );
};

export default Dashboard;
