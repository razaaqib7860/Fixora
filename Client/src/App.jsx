import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth & Common Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/profile/Profile';
import Unauthorized from './pages/common/Unauthorized';

// Dashboards
import StudentDashboard from './pages/dashboard/StudentDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import Dashboard from './pages/dashboard/Dashboard'; // Placeholder for Caretaker, Rep, Admin until Phase 4

// Complaints Pages
import RaiseComplaint from './pages/complaints/RaiseComplaint';
import MyComplaints from './pages/complaints/MyComplaints';
import ComplaintDetail from './pages/complaints/ComplaintDetail';

// Smart Home redirect based on role
const RoleHomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'STUDENT') return <Navigate to="/dashboard" replace />;
  if (user.role === 'STAFF') return <Navigate to="/staff/dashboard" replace />;
  if (user.role === 'CARETAKER') return <Navigate to="/caretaker/dashboard" replace />;
  if (user.role === 'HOSTEL_REPRESENTATIVE') return <Navigate to="/rep/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<RoleHomeRedirect />} />

            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Authenticated Common Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Student Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Staff Dashboard */}
            <Route
              path="/staff/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STAFF']}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />

            {/* Complaint Workflows */}
            <Route
              path="/complaints/new"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <RaiseComplaint />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints"
              element={
                <ProtectedRoute>
                  <MyComplaints />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints/:id"
              element={
                <ProtectedRoute>
                  <ComplaintDetail />
                </ProtectedRoute>
              }
            />

            {/* Other Role Dashboards (to be fleshed out in Phase 4) */}
            <Route
              path="/caretaker/dashboard"
              element={
                <ProtectedRoute allowedRoles={['CARETAKER']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rep/dashboard"
              element={
                <ProtectedRoute allowedRoles={['HOSTEL_REPRESENTATIVE']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'WARDEN']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
