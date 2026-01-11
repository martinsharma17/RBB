// src/App.tsx
// ==============================================================================
// MAIN APPLICATION COMPONENT
// ==============================================================================
// This is the root component that sets up routing and global providers.
// Key responsibilities:
// 1. App Wrappers: AuthProvider for state.
// 2. Routing: Uses React Router to navigate between pages.
// 3. Protected Routes: Checks if user is logged in AND has the right role before showing a page.

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectSettingsProvider } from './context/ProjectSettingsContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './pages/Dashboard';
// Password reset pages
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PublicKyc from './pages/PublicKyc';

import { jwtDecode } from "jwt-decode";
import Navbar from './components/layout/Navbar';
import type { DecodedToken } from './types';


// ==============================================================================
// HELPER: ROLE EXTRACTION
// ==============================================================================
// Decodes the JWT token to find what roles the user has.
// This is needed because the "Role" claim in tokens can appear under different key names
// depending on whether it's Microsoft Identity, Google, or custom.
function getUserRoles(token: string | null): string[] {
  if (!token) return [];
  try {
    const decoded = jwtDecode<DecodedToken>(token);

    // Check multiple potential keys for roles:
    // 1. Microsoft Identity Standard URL
    // 2. Simple "role"
    // 3. Simple "roles" array
    const roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      || decoded["role"]
      || decoded["roles"];

    if (!roles) return [];

    // Ensure we always return an array (even if single role string)
    return Array.isArray(roles) ? roles : [roles];
  } catch (error) {
    console.error("Error decoding token or extracting roles:", error);
    return [];
  }
}

// ==============================================================================
// APP CONTENT (Inner Component)
// ==============================================================================
// We separate this so we can use hooks like `useAuth` which require valid Context.
function AppContent() {
  const { token } = useAuth(); // Get current login token

  // Determine roles from the token
  const roles = getUserRoles(token);

  // Boolean flags for easy permission checks in JSX
  const isSuperAdmin = roles.includes("SuperAdmin");
  void isSuperAdmin;

  return (
    <div className="App">
      <header className="header">
        {/* Only show Navbar if user is logged in */}
        {token && <Navbar />}
      </header>
      <main>
        <Routes>
          {/* Public Routes: Accessible by anyone */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          {/* Password Reset Routes: Public (no auth required) */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/public-kyc" element={<PublicKyc />} />

          {/* 
             ==============================================================================
             PROTECTED ROUTE LOGIC
             ==============================================================================
             The following logic directs users to different dashboards based on their role.
             Structure:
             1. Check if logged in (token exists?) -> If no, Redirect to Login.
             2. If logged in, Check specific roles in order of priority.
             3. Render appropriate Dashboard.
          */}
          <Route
            path="/dashboard"
            element={
              token ? (
                // USER IS LOGGED IN
                // Use the Unified Dashboard for ALL roles.
                // It adapts its sidebar and views based on dynamic permissions.
                <Dashboard />
              ) : (
                // USER IS NOT LOGGED IN -> Redirect to Login
                <Navigate to="/login" />
              )
            }
          />

          {/* Default Route: Redirect root URL to dashboard (which handles auth check) */}
          <Route
            path="/"
            element={<Navigate to={token ? "/dashboard" : "/login"} />}
          />
        </Routes>
      </main>
    </div>
  );
}

// ==============================================================================
// ROOT APP COMPONENT
// ==============================================================================
export default function App() {
  return (
    // Wrap entire app in AuthProvider to make auth state global
    <AuthProvider>
      <ProjectSettingsProvider>
        <AppContent />
      </ProjectSettingsProvider>
    </AuthProvider>
  )
}
