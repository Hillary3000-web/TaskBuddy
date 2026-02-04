/**
 * TaskBuddy - Theme Context Provider
 * 
 * Manages the application's visual theme (background).
 * Persists user preference to localStorage.
 * 
 * @module context/ThemeContext
 */

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

/**
 * Available themes configuration.
 * Maps theme IDs to Tailwind CSS classes.
 */
export const themes = {
    default: {
        id: 'default',
        name: 'Default Dark',
        className: 'bg-slate-900',
        preview: 'bg-slate-900'
    },
    ocean: {
        id: 'ocean',
        name: 'Deep Ocean',
        className: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900',
        preview: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900'
    },
    sunset: {
        id: 'sunset',
        name: 'Cosmic Sunset',
        className: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900',
        preview: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900'
    },
    forest: {
        id: 'forest',
        name: 'Midnight Forest',
        className: 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900',
        preview: 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900'
    },
    nebula: {
        id: 'nebula',
        name: 'Nebula',
        className: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black',
        preview: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black'
    }
};

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState(() => {
        const savedTheme = localStorage.getItem('taskbuddy_theme');
        return themes[savedTheme] ? savedTheme : 'default';
    });

    const changeTheme = (themeId) => {
        if (themes[themeId]) {
            setCurrentTheme(themeId);
            localStorage.setItem('taskbuddy_theme', themeId);
        }
    };

    const value = {
        theme: themes[currentTheme],
        currentTheme,
        changeTheme,
        themes
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
