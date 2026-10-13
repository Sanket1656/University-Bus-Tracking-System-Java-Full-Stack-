import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';

// Route guard
import ProtectedRoute from './routes/ProtectedRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './components/layouts/AuthLayout';
import DashboardLayout from './components/layouts/DashboardLayout';

// Auth pages (new)
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Legacy auth pages (preserved)
import Register from './pages/Register';
import Login from './pages/Login';

// Student / Driver portal pages (preserved)
import StudentHome from './pages/StudentHome';
import DriverHome from './pages/DriverHome';
import StudentProfile from './Profiles/StudentProfile';
import DriverProfile from './Profiles/DriverProfile';
import Home from './pages/Home';

// Student transport
import StudentTransport from './pages/student/transport/StudentTransport';
import MyBus from './pages/student/transport/MyBus';
import StudentSchedule from './pages/student/StudentSchedule';

// Student tracking (Phase 1)
import TrackBusPage from './pages/student/tracking/TrackBusPage';

// Driver pages
import DriverMyBus from './pages/driver/DriverMyBus';
import DriverTripHistory from './pages/driver/DriverTripHistory';
import DriverTripDetails from './pages/driver/DriverTripDetails';

// Admin pages (new)
import DashboardPage from './pages/admin/DashboardPage';
import BusesPage from './pages/admin/BusesPage';
import DriversPage from './pages/admin/DriversPage';
import StudentsPage from './pages/admin/StudentsPage';
import StopsPage from './pages/admin/StopsPage';
import RoutesPage from './pages/admin/RoutesPage';
import AssignmentsPage from './pages/admin/AssignmentsPage';
import TrackingPage from './pages/admin/TrackingPage';
import SettingsPage from './pages/admin/SettingsPage';
import TransportPage           from './pages/admin/transport/TransportPage';
import DemoFleetSimulatorPage  from './pages/admin/DemoFleetSimulatorPage';
import ScheduleManagement from './pages/admin/ScheduleManagement';

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <Routes>
          {/* ── Root redirect ── */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ── Auth routes (new styled pages) ── */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Legacy auth routes (kept for backwards compat) ── */}
          <Route path="/old-register" element={<AuthLayout title="Create an Account" subtitle="Join the next generation of campus transit"><Register /></AuthLayout>} />
          <Route path="/old-login"    element={<AuthLayout title="Welcome Back" subtitle="Log in to your dashboard"><Login /></AuthLayout>} />

          {/* ── Student portal (preserved) ── */}
          <Route path="/page"            element={<DashboardLayout><Home /></DashboardLayout>} />
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <DashboardLayout><StudentHome /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <DashboardLayout><StudentProfile /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/transport"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <DashboardLayout><StudentTransport /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/my-bus"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <DashboardLayout><MyBus /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/schedule"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <DashboardLayout><StudentSchedule /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/track-bus"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <DashboardLayout><TrackBusPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ── Driver portal (preserved) ── */}
          <Route
            path="/driver"
            element={
              <ProtectedRoute allowedRoles={['Driver']}>
                <DashboardLayout><DriverHome /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/profile"
            element={
              <ProtectedRoute allowedRoles={['Driver']}>
                <DashboardLayout><DriverProfile /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/my-bus"
            element={
              <ProtectedRoute allowedRoles={['Driver']}>
                <DashboardLayout><DriverMyBus /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/trip-history"
            element={
              <ProtectedRoute allowedRoles={['Driver']}>
                <DashboardLayout><DriverTripHistory /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/trip-history/:tripId"
            element={
              <ProtectedRoute allowedRoles={['Driver']}>
                <DashboardLayout><DriverTripDetails /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ── Admin routes (new AdminLayout + ProtectedRoute) ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index                element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"     element={<DashboardPage />} />
            <Route path="buses"         element={<BusesPage />} />
            <Route path="drivers"       element={<DriversPage />} />
            <Route path="students"      element={<StudentsPage />} />
            <Route path="stops"         element={<StopsPage />} />
            <Route path="routes"        element={<RoutesPage />} />
            <Route path="assignments"   element={<AssignmentsPage />} />
            <Route path="schedules"     element={<ScheduleManagement />} />
            <Route path="transport"     element={<TransportPage />} />
            <Route path="tracking"      element={<TrackingPage />} />
            <Route path="demo-fleet"    element={<DemoFleetSimulatorPage />} />
            <Route path="settings"      element={<SettingsPage />} />
          </Route>

          {/* ── Catch-all ── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
