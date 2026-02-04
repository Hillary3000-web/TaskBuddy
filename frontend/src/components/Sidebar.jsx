/**
 * TaskBuddy - Sidebar Navigation Component
 * 
 * A responsive sidebar providing navigation links, user profile,
 * notification bell, and logout functionality.
 * 
 * Features:
 * - Responsive design with mobile overlay
 * - Active route highlighting
 * - Navigation links to all main pages
 * - Notification bell with live updates
 * - User profile display
 * - Logout button
 * - Smooth slide-in/out animations
 * 
 * @module components/Sidebar
 * @version 2.0.0
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import {
    LayoutDashboard,
    ListTodo,
    Target,
    Settings,
    LogOut,
    X,
    Zap,
    BarChart3
} from 'lucide-react';

/**
 * Navigation items configuration.
 * Each item maps to a route with icon and label.
 * @constant {Array<{to: string, icon: React.Component, label: string}>}
 */
const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tasks', icon: ListTodo, label: 'Tasks' },
    { to: '/goals', icon: Target, label: 'Goals' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

/**
 * Sidebar navigation component.
 * 
 * Provides main navigation for the application with responsive
 * behavior for mobile and desktop viewports.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether sidebar is visible (mobile)
 * @param {Function} props.onToggle - Callback to toggle sidebar visibility
 * @returns {JSX.Element} Sidebar component
 * 
 * @example
 * const [sidebarOpen, setSidebarOpen] = useState(false);
 * 
 * <Sidebar 
 *   isOpen={sidebarOpen} 
 *   onToggle={() => setSidebarOpen(!sidebarOpen)} 
 * />
 */
const Sidebar = ({ isOpen, onToggle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    /**
     * Handle logout action.
     * Clears auth state and redirects to login page.
     */
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    /**
     * Handle navigation link click.
     * Closes sidebar immediately after click.
     */
    const handleNavClick = () => {
        // Always close sidebar on nav click for cleaner UX
        onToggle();
    };

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={onToggle}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed top-0 left-0 h-full w-64 bg-slate-800/95 backdrop-blur-xl 
                    border-r border-slate-700/50 z-50 transform transition-transform 
                    duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0
                `}
                role="navigation"
                aria-label="Main navigation"
            >
                <div className="flex flex-col h-full">
                    {/* Header with Logo */}
                    <div className="p-6 border-b border-slate-700/50">
                        <div className="flex items-center justify-between">
                            {/* Logo and Brand */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">TaskBuddy</h1>
                                    <p className="text-xs text-slate-500">Productivity Hub</p>
                                </div>
                            </div>

                            {/* Actions: Notification Bell & Close Button */}
                            <div className="flex items-center gap-2">
                                <NotificationBell />
                                <button
                                    onClick={onToggle}
                                    className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                                    aria-label="Close sidebar"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 p-4 space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={handleNavClick}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                    ${isActive
                                        ? 'bg-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }
                                `}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* User Profile & Logout Section */}
                    <div className="p-4 border-t border-slate-700/50">
                        {/* User Info */}
                        <div className="flex items-center gap-3 px-4 py-3 mb-2">
                            {/* User Avatar */}
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            {/* User Details */}
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">
                                    {user?.username || 'User'}
                                </p>
                                <p className="text-slate-500 text-xs truncate">
                                    {user?.email || 'user@example.com'}
                                </p>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
