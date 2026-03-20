import { useEffect, lazy, Suspense } from 'react';
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
import Attendance from '@/pages/Attendance';
import Leave from '@/pages/Leave';
import Payroll from '@/pages/Payroll';
import Performance from '@/pages/Performance';
import Recruitment from '@/pages/Recruitment';
import Learning from '@/pages/Learning';
import HelpDesk from '@/pages/HelpDesk';
import Announcements from '@/pages/Announcements';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import OfferView from '@/pages/recruitment/OfferView';
import Documents from '@/pages/Documents';
import Onboarding from '@/pages/Onboarding';
import ExitManagement from '@/pages/ExitManagement';
import OrgChart from '@/pages/OrgChart';
import HolidayCalendar from '@/pages/HolidayCalendar';


import Companies from '@/pages/admin/Companies';
import Subscriptions from '@/pages/admin/Subscriptions';
import SystemSettings from '@/pages/admin/SystemSettings';

// Sub-pages (lazy loaded for performance)
const NewEmployee = lazy(() => import('@/pages/employees/NewEmployee'));
const EmployeeDetail = lazy(() => import('@/pages/employees/EmployeeDetail'));
const ApplyLeave = lazy(() => import('@/pages/leaves/ApplyLeave'));
const NewJob = lazy(() => import('@/pages/recruitment/NewJob'));

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

  // Loading fallback for lazy routes
  const LazyFallback = () => (
    <div className="flex h-64 items-center justify-center">
      <div className="font-mono text-muted-foreground text-sm animate-pulse">LOADING MODULE...</div>
    </div>
  );

  const withLayout = (component: React.ReactNode, role?: string) => (
    <ProtectedRoute requiredRole={role as any}>
      <DashboardLayout>
        <Suspense fallback={<LazyFallback />}>
          {component}
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/offer/:token" element={<OfferView />} />


      {/* Core HR modules */}
      <Route path="/dashboard" element={withLayout(<Dashboard />)} />
      <Route path="/employees" element={withLayout(<Employees />)} />
      <Route path="/employees/new" element={withLayout(<NewEmployee />)} />
      <Route path="/employees/:id" element={withLayout(<EmployeeDetail />)} />
      <Route path="/attendance" element={withLayout(<Attendance />)} />
      <Route path="/leave" element={withLayout(<Leave />)} />
      <Route path="/leave/apply" element={withLayout(<ApplyLeave />)} />
      <Route path="/payroll" element={withLayout(<Payroll />)} />
      <Route path="/performance" element={withLayout(<Performance />)} />
      <Route path="/recruitment" element={withLayout(<Recruitment />)} />
      <Route path="/recruitment/new" element={withLayout(<NewJob />)} />
      <Route path="/recruitment/edit/:id" element={withLayout(<NewJob />)} />
      <Route path="/learning" element={withLayout(<Learning />)} />
      <Route path="/helpdesk" element={withLayout(<HelpDesk />)} />
      <Route path="/announcements" element={withLayout(<Announcements />)} />
      <Route path="/reports" element={withLayout(<Reports />)} />
      <Route path="/documents" element={withLayout(<Documents />)} />
      <Route path="/onboarding" element={withLayout(<Onboarding />)} />
      <Route path="/exit-management" element={withLayout(<ExitManagement />)} />
      <Route path="/org-chart" element={withLayout(<OrgChart />)} />
      <Route path="/holidays" element={withLayout(<HolidayCalendar />)} />
      <Route path="/settings/*" element={withLayout(<Settings />)} />

      {/* Super Admin routes */}
      <Route path="/admin" element={withLayout(<Dashboard />, 'super_admin')} />
      <Route path="/admin/companies" element={withLayout(<Companies />, 'super_admin')} />
      <Route path="/admin/subscriptions" element={withLayout(<Subscriptions />, 'super_admin')} />
      <Route path="/admin/system" element={withLayout(<SystemSettings />, 'super_admin')} />

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
