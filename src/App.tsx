import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/hooks/use-theme';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Employees from '@/pages/Employees';
import PlaceholderPage from '@/pages/PlaceholderPage';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function AppRoutes() {
  const { initialize, initialized } = useAuthStore();
  const { theme } = useTheme();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes - wrapped in DashboardLayout */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><DashboardLayout><Employees /></DashboardLayout></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><DashboardLayout><PlaceholderPage title="Attendance" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/leave" element={<ProtectedRoute><DashboardLayout><PlaceholderPage title="Leave Management" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/payroll" element={<ProtectedRoute><DashboardLayout><PlaceholderPage title="Payroll" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/performance" element={<ProtectedRoute><DashboardLayout><PlaceholderPage title="Performance" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/recruitment" element={<ProtectedRoute><DashboardLayout><PlaceholderPage title="Recruitment" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/learning" element={<ProtectedRoute><DashboardLayout><PlaceholderPage title="Learning & Development" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/helpdesk" element={<ProtectedRoute><DashboardLayout><PlaceholderPage title="Help Desk" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute><DashboardLayout><PlaceholderPage title="Announcements" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><DashboardLayout><PlaceholderPage title="Reports & Analytics" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/settings/*" element={<ProtectedRoute><DashboardLayout><PlaceholderPage title="Settings" /></DashboardLayout></ProtectedRoute>} />

      {/* Super Admin routes */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="super_admin"><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/companies" element={<ProtectedRoute requiredRole="super_admin"><DashboardLayout><PlaceholderPage title="Companies" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/subscriptions" element={<ProtectedRoute requiredRole="super_admin"><DashboardLayout><PlaceholderPage title="Subscriptions" /></DashboardLayout></ProtectedRoute>} />
      <Route path="/admin/system" element={<ProtectedRoute requiredRole="super_admin"><DashboardLayout><PlaceholderPage title="System Settings" /></DashboardLayout></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
