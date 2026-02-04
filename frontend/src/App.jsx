/**
 * TaskBuddy - Root Application Component
 * 
 * The main entry point for the TaskBuddy React application.
 * Configures routing, context providers, and protected routes.
 * 
 * Provider Hierarchy:
 * - Router (react-router-dom)
 *   - AuthProvider (authentication state)
 *     - ToastProvider (toast notifications)
 *       - NotificationProvider (push notifications)
 *         - Routes
 * 
 * Routes:
 * - /login - Public login page
 * - /register - Public registration page
 * - /dashboard - Protected main dashboard
 * - /tasks - Protected tasks list page
 * - /goals - Protected goals page
 * - /analytics - Protected analytics dashboard
 * - /settings - Protected settings page
 * - / and /* - Redirect to dashboard
 * 
 * @module App
 * @version 2.0.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { TimerProvider } from './context/TimerContext';
import FocusOverlay from './components/FocusOverlay';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import GoalsPage from './pages/GoalsPage';
import SettingsPage from './pages/SettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';

/**
 * Layout component that applies the global theme background.
 */
const ThemedLayout = ({ children }) => {
  const { theme } = useTheme();
  const location = useLocation();

  // Don't apply theme to public auth pages if they have their own specific style,
  // but for consistency we'll apply it everywhere or just to protected routes.
  // For now, let's apply globally.

  return (
    <div className={`min-h-screen transition-colors duration-500 ease-in-out ${theme.className}`}>
      {children}
    </div>
  );
};

/**
 * Root Application component.
 * 
 * Sets up the application with all required context providers
 * and routing configuration for both public and protected routes.
 * 
 * @component
 * @returns {JSX.Element} The complete application with routing
 */
function App() {
  return (
    <Router>
      {/* Theme Context - Manages global background/appearance */}
      <ThemeProvider>
        {/* Authentication Context - Manages user login state */}
        <AuthProvider>
          {/* Toast Notifications - App-wide toast messages */}
          <ToastProvider>
            {/* Push Notifications - Browser notifications */}
            <NotificationProvider>
              {/* Timer Context - Global Focus/Pomodoro Timer */}
              <TimerProvider>
                <FocusOverlay />
                <ThemedLayout>
                  <Routes>
                    {/* ======== Public Routes ======== */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* ======== Protected Routes ======== */}
                    {/* All protected routes require authentication */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/tasks"
                      element={
                        <ProtectedRoute>
                          <TasksPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/goals"
                      element={
                        <ProtectedRoute>
                          <GoalsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute>
                          <AnalyticsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* ======== Default Redirects ======== */}
                    {/* Redirect root and unknown paths to dashboard */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </ThemedLayout>
              </TimerProvider>
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;