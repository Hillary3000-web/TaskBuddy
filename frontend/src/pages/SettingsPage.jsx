import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import { User, Mail, Shield, LogOut, Moon, Bell, Palette, ChevronRight, Loader2, Check } from 'lucide-react';

const SettingsPage = () => {
    const { user, logout } = useAuth();
    const { currentTheme, changeTheme, themes } = useTheme();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Settings state (localStorage-based for now)
    const [notifications, setNotifications] = useState(() => {
        return localStorage.getItem('taskbuddy_notifications') !== 'false';
    });

    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('taskbuddy_darkmode') !== 'false';
    });

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        logout();
        navigate('/login');
    };

    const toggleNotifications = () => {
        const newValue = !notifications;
        setNotifications(newValue);
        localStorage.setItem('taskbuddy_notifications', newValue.toString());
    };

    const toggleDarkMode = () => {
        const newValue = !darkMode;
        setDarkMode(newValue);
        localStorage.setItem('taskbuddy_darkmode', newValue.toString());
    };

    const settingsSections = [
        {
            title: 'Preferences',
            items: [
                {
                    icon: Bell,
                    label: 'Notifications',
                    description: 'Receive reminders and updates',
                    type: 'toggle',
                    value: notifications,
                    onChange: toggleNotifications
                }
            ]
        },
        {
            title: 'About',
            items: [
                {
                    icon: Shield,
                    label: 'Version',
                    description: 'TaskBuddy v1.0.0',
                    type: 'info'
                }
            ]
        }
    ];

    return (
        <div className="flex bg-transparent">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                {/* Header */}
                <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-10">
                    <div className="px-4 md:px-8 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-white">Settings</h1>
                            <p className="text-slate-400 text-sm mt-1">Manage your preferences</p>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                        >
                            <Palette className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-2xl">
                    {/* Profile Card */}
                    <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30 rounded-2xl p-6 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <span className="text-white font-bold text-2xl">
                                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-white">{user?.username || 'User'}</h2>
                                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                                    <Mail className="w-4 h-4" />
                                    {user?.email || 'No email'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Appearance Section */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3 px-1">
                            Appearance
                        </h3>
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-slate-700/50 rounded-lg">
                                    <Palette className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Background Theme</p>
                                    <p className="text-slate-500 text-sm">Customize your dashboard look</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {Object.values(themes).map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => changeTheme(theme.id)}
                                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${currentTheme === theme.id
                                                ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105'
                                                : 'border-transparent hover:border-slate-600 hover:scale-105'
                                            }`}
                                    >
                                        <div className={`w-full h-full ${theme.preview}`} />
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-2 text-center">
                                            <span className="text-[10px] uppercase font-bold text-white tracking-wide">
                                                {theme.name}
                                            </span>
                                        </div>
                                        {currentTheme === theme.id && (
                                            <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm">
                                                <Check className="h-3 w-3" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Settings Sections */}
                    {settingsSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mb-6">
                            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3 px-1">
                                {section.title}
                            </h3>
                            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                                {section.items.map((item, itemIndex) => (
                                    <div
                                        key={itemIndex}
                                        className={`flex items-center justify-between p-4 ${itemIndex !== section.items.length - 1 ? 'border-b border-slate-700/50' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-slate-700/50 rounded-lg">
                                                <item.icon className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{item.label}</p>
                                                <p className="text-slate-500 text-sm">{item.description}</p>
                                            </div>
                                        </div>

                                        {item.type === 'toggle' && (
                                            <button
                                                onClick={item.onChange}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${item.value ? 'bg-indigo-500' : 'bg-slate-600'
                                                    }`}
                                            >
                                                <div
                                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${item.value ? 'translate-x-7' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                        )}

                                        {item.type === 'link' && (
                                            <ChevronRight className="w-5 h-5 text-slate-500" />
                                        )}

                                        {item.type === 'info' && (
                                            <span className="text-slate-500 text-sm font-medium">
                                                {item.description}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium py-4 px-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoggingOut ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Logging out...
                            </>
                        ) : (
                            <>
                                <LogOut className="w-5 h-5" />
                                Logout
                            </>
                        )}
                    </button>

                    {/* Footer */}
                    <p className="text-center text-slate-600 text-sm mt-8">
                        Made with ❤️ by TaskBuddy Team
                    </p>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;
