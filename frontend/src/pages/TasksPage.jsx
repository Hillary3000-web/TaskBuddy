import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
import { Plus, Search, Filter, SortAsc, Loader2, CheckCircle2 } from 'lucide-react';

const TasksPage = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddingTask, setIsAddingTask] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, pending, completed
    const [priorityFilter, setPriorityFilter] = useState('all'); // all, high, medium, low
    const [sortBy, setSortBy] = useState('created'); // created, dueDate, priority

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [tasks, searchQuery, statusFilter, priorityFilter, sortBy]);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/tasks/');
            setTasks(response.data || []);
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        }
        setIsLoading(false);
    };

    const applyFilters = () => {
        let result = [...tasks];

        // Search filter
        if (searchQuery) {
            result = result.filter(task =>
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter === 'pending') {
            result = result.filter(task => !task.completed);
        } else if (statusFilter === 'completed') {
            result = result.filter(task => task.completed);
        }

        // Priority filter
        if (priorityFilter !== 'all') {
            result = result.filter(task => task.priority === priorityFilter);
        }

        // Sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'dueDate':
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                default:
                    return new Date(b.created_at) - new Date(a.created_at);
            }
        });

        setFilteredTasks(result);
    };

    const handleAddTask = async (taskData) => {
        setIsAddingTask(true);
        try {
            const response = await api.post('/tasks/', taskData);
            setTasks([response.data, ...tasks]);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to add task:', error);
        }
        setIsAddingTask(false);
    };

    const toggleTaskComplete = async (taskId) => {
        try {
            const response = await api.patch(`/tasks/${taskId}/toggle/`);
            setTasks(tasks.map(task =>
                task.id === taskId ? response.data : task
            ));
        } catch (error) {
            console.error('Failed to toggle task:', error);
        }
    };

    const deleteTask = async (taskId) => {
        try {
            await api.delete(`/tasks/${taskId}/`);
            setTasks(tasks.filter(task => task.id !== taskId));
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    };

    const statusTabs = [
        { key: 'all', label: 'All Tasks', count: tasks.length },
        { key: 'pending', label: 'Pending', count: tasks.filter(t => !t.completed).length },
        { key: 'completed', label: 'Completed', count: tasks.filter(t => t.completed).length },
    ];

    return (
        <div className="min-h-screen bg-slate-900 flex">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                {/* Header */}
                <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-10">
                    <div className="px-4 md:px-8 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-white">Tasks</h1>
                            <p className="text-slate-400 text-sm mt-1">Manage and organize your tasks</p>
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
                    {/* Search and Filters */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search tasks..."
                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Priority Filter */}
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-slate-500" />
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    className="bg-slate-900/50 border border-slate-600 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>

                            {/* Sort */}
                            <div className="flex items-center gap-2">
                                <SortAsc className="w-5 h-5 text-slate-500" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-slate-900/50 border border-slate-600 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                >
                                    <option value="created">Newest First</option>
                                    <option value="dueDate">Due Date</option>
                                    <option value="priority">Priority</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setStatusFilter(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${statusFilter === tab.key
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                            >
                                {tab.label}
                                <span className={`px-2 py-0.5 rounded-lg text-xs ${statusFilter === tab.key
                                    ? 'bg-white/20'
                                    : 'bg-slate-700'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Tasks List */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">
                                {statusFilter === 'all' ? 'All Tasks' : statusFilter === 'pending' ? 'Pending Tasks' : 'Completed Tasks'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add Task</span>
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                            </div>
                        ) : filteredTasks.length > 0 ? (
                            <div className="space-y-4">
                                {filteredTasks.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onToggle={() => toggleTaskComplete(task.id)}
                                        onDelete={() => deleteTask(task.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-slate-500" />
                                </div>
                                <p className="text-slate-400 mb-4">
                                    {searchQuery || priorityFilter !== 'all'
                                        ? 'No tasks match your filters'
                                        : 'No tasks yet. Add your first task!'}
                                </p>
                                {!searchQuery && priorityFilter === 'all' && (
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Task
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <AddTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddTask}
                isLoading={isAddingTask}
            />
        </div>
    );
};

export default TasksPage;
