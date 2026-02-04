/**
 * TaskBuddy - Add/Edit Task Modal Component
 * 
 * A modal dialog for creating new tasks or editing existing ones.
 * Supports categories, priority levels, due dates, and reminders.
 * 
 * Features:
 * - Dynamic form for new task creation or task editing
 * - Category dropdown with fetched user categories
 * - Priority selection (low, medium, high)
 * - Due date picker
 * - Reminder time picker with browser notification support
 * - Loading state during submission
 * - Form validation
 * 
 * @module components/AddTaskModal
 * @version 2.0.0
 */

import { useState, useEffect } from 'react';
import { X, Calendar, Flag, Loader2, Bell, FolderOpen } from 'lucide-react';
import api from '../api/axios';

/**
 * Add/Edit Task Modal component.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSubmit - Callback with task data on form submit
 * @param {boolean} props.isLoading - Whether submission is in progress
 * @param {Object|null} [props.editTask=null] - Existing task to edit (null for new)
 * @returns {JSX.Element|null} Modal component or null if not open
 * 
 * @example
 * // New task mode
 * <AddTaskModal 
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSubmit={handleCreateTask}
 *   isLoading={creating}
 * />
 * 
 * @example
 * // Edit task mode
 * <AddTaskModal 
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSubmit={handleUpdateTask}
 *   isLoading={updating}
 *   editTask={selectedTask}
 * />
 */
const AddTaskModal = ({ isOpen, onClose, onSubmit, isLoading, editTask = null }) => {
    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================

    /** Task title input (required) */
    const [title, setTitle] = useState('');

    /** Task description textarea */
    const [description, setDescription] = useState('');

    /** Priority level selection */
    const [priority, setPriority] = useState('medium');

    /** Due date in YYYY-MM-DD format */
    const [dueDate, setDueDate] = useState('');

    /** Reminder datetime in datetime-local format */
    const [reminderTime, setReminderTime] = useState('');

    /** Selected category ID */
    const [categoryId, setCategoryId] = useState('');

    /** Available categories fetched from API */
    const [categories, setCategories] = useState([]);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    /**
     * Fetch user's categories when modal opens.
     */
    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    /**
     * Populate form fields when editing an existing task.
     * Resets form to empty when creating a new task.
     */
    useEffect(() => {
        if (editTask) {
            // Editing mode - populate form with existing task data
            setTitle(editTask.title || '');
            setDescription(editTask.description || '');
            setPriority(editTask.priority || 'medium');
            setDueDate(editTask.dueDate || '');
            // Trim datetime to match datetime-local input format
            setReminderTime(editTask.reminderTime ? editTask.reminderTime.slice(0, 16) : '');
            setCategoryId(editTask.category?.id || '');
        } else {
            // New task mode - reset all fields
            setTitle('');
            setDescription('');
            setPriority('medium');
            setDueDate('');
            setReminderTime('');
            setCategoryId('');
        }
    }, [editTask, isOpen]);

    // ========================================================================
    // API CALLS
    // ========================================================================

    /**
     * Fetch available categories from the API.
     * @async
     */
    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories/');
            setCategories(response.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /**
     * Handle form submission.
     * Validates required fields and calls onSubmit with formatted data.
     * 
     * @param {React.FormEvent} e - Form submit event
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        const taskData = {
            title: title.trim(),
            description: description.trim(),
            priority,
            dueDate: dueDate || null,
            // Convert local datetime to ISO string for API
            reminderTime: reminderTime ? new Date(reminderTime).toISOString() : null,
            categoryId: categoryId || null,
        };

        await onSubmit(taskData, editTask?.id);

        // Reset form only for new tasks (edit mode closed by parent)
        if (!editTask) {
            setTitle('');
            setDescription('');
            setPriority('medium');
            setDueDate('');
            setReminderTime('');
            setCategoryId('');
        }
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    // Don't render if modal is closed
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur effect */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-md bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-semibold text-white">
                        {editTask ? 'Edit Task' : 'Add New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title Input (Required) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="What needs to be done?"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Description Textarea */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                            placeholder="Add more details (optional)"
                        />
                    </div>

                    {/* Category Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <FolderOpen className="w-4 h-4" />
                            Category
                        </label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        >
                            <option value="">No category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Priority & Due Date Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Priority Selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <Flag className="w-4 h-4" />
                                Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        {/* Due Date Picker */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Reminder Time Picker */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            Reminder
                        </label>
                        <input
                            type="datetime-local"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        <p className="text-xs text-slate-500">
                            You'll receive a notification at this time
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !title.trim()}
                            className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {editTask ? 'Saving...' : 'Adding...'}
                                </>
                            ) : (
                                editTask ? 'Save Changes' : 'Add Task'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTaskModal;
