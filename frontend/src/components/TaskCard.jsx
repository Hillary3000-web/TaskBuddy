/**
 * TaskBuddy - Task Card Component
 * 
 * A card component displaying individual task information with
 * priority indicators, due dates, and completion toggle.
 * 
 * Features:
 * - Priority-based color coding (high/medium/low)
 * - Completion checkbox with visual feedback
 * - Due date formatting (Today, Tomorrow, or date)
 * - Delete button on hover
 * - Smooth hover animations
 * 
 * @module components/TaskCard
 * @version 2.0.0
 */

import { Calendar, Flag, CheckCircle2, Circle, Trash2, Play } from 'lucide-react';

/**
 * Priority configuration object with colors and labels.
 * @constant {Object.<string, {color: string, bg: string, border: string, label: string}>}
 */
const priorityConfig = {
    high: {
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        label: 'High'
    },
    medium: {
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        label: 'Medium'
    },
    low: {
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        label: 'Low'
    }
};

/**
 * Format a date string for display.
 * Returns "Today", "Tomorrow", or formatted date.
 * 
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @returns {string} Formatted date string
 */
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Task Card component for displaying individual tasks.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.task - Task data object
 * @param {number} props.task.id - Unique task identifier
 * @param {string} props.task.title - Task title
 * @param {string} [props.task.description] - Optional task description
 * @param {('high'|'medium'|'low')} props.task.priority - Priority level
 * @param {string} [props.task.dueDate] - Due date in YYYY-MM-DD format
 * @param {boolean} props.task.completed - Completion status
 * @param {Function} props.onToggle - Callback when task completion is toggled
 * @param {Function} [props.onDelete] - Optional callback when task is deleted
 * @returns {JSX.Element} Task card component
 * 
 * @example
 * <TaskCard 
 *   task={{ 
 *     id: 1, 
 *     title: 'Complete report', 
 *     priority: 'high',
 *     dueDate: '2024-12-15',
 *     completed: false 
 *   }}
 *   onToggle={() => toggleTask(1)}
 *   onDelete={() => deleteTask(1)}
 * />
 */
const TaskCard = ({ task, onToggle, onDelete }) => {
    const { title, description, priority, dueDate, completed } = task;
    const config = priorityConfig[priority] || priorityConfig.low;

    /**
     * Handle delete button click.
     * Stops event propagation to prevent toggle.
     * 
     * @param {React.MouseEvent} e - Click event
     */
    const handleDelete = (e) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete();
        }
    };

    return (
        <div
            className={`
                group relative bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 
                rounded-xl p-4 transition-all duration-200 cursor-pointer
                ${completed ? 'opacity-60' : ''}
            `}
            onClick={onToggle}
            role="button"
            aria-pressed={completed}
            aria-label={`${title} - ${completed ? 'completed' : 'pending'}`}
        >
            <div className="flex items-start gap-4">
                {/* Completion Checkbox */}
                <button
                    className="mt-0.5 flex-shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                    aria-label={completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                    {completed ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                        <Circle className="w-6 h-6 text-slate-500 group-hover:text-slate-400 transition-colors" />
                    )}
                </button>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            {/* Task Title */}
                            <h3 className={`font-medium ${completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                                {title}
                            </h3>

                            {/* Task Description */}
                            {description && (
                                <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* Focus Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onFocus) onFocus();
                            }}
                            className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all mr-1"
                            title="Focus on this task"
                        >
                            <Play className="w-4 h-4 ml-0.5" />
                        </button>

                        {/* Delete Button (appears on hover) */}
                        {onDelete && (
                            <button
                                onClick={handleDelete}
                                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                title="Delete task"
                                aria-label="Delete task"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Task Metadata */}
                    <div className="flex items-center gap-3 mt-3">
                        {/* Priority Badge */}
                        <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.color} border ${config.border}`}
                        >
                            <Flag className="w-3 h-3" />
                            {config.label}
                        </span>

                        {/* Due Date */}
                        {dueDate && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                <Calendar className="w-3 h-3" />
                                {formatDate(dueDate)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Left Border Accent (appears on hover) */}
            <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

export default TaskCard;
