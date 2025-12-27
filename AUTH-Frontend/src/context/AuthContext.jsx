// src/context/AuthContext.js
// ==============================================================================
// AUTHENTICATION CONTEXT (Global State)
// ==============================================================================
// This file manages the "who is logged in" state for the entire application.
// It provides:
// 1. `token`: The JWT string used for API authentication.
// 2. `user`: An object containing user details and roles.
// 3. `login(email, password)`: Function to call the backend login API.
// 4. `logout()`: Function to clear state and sign out.
//
// HOW IT WORKS:
// - On app start, it checks `localStorage` for an existing token.
// - If found, it decodes the token to restore the user's session (so you stay logged in on refresh).
// - It exposes this state via `useAuth()` hook so any component (Navbar, Dashboard) can access it.

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { mapBackendPermissionsToFrontend } from '../utils/permissionMapper';

// Create the context object
const AuthContext = createContext();

// Custom Hook for consistent access
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// ==============================================================================
// AUTH PROVIDER COMPONENT
// ==============================================================================
/**
 * 🛠️ DEVELOPER GUIDE: AUTHENTICATION STATE
 * 
 * This component wraps the entire app and provides the `useAuth()` hook.
 * 
 * 📦 STATE MANAGED:
 * 1. `token`: The JWT string (persisted in localStorage as 'authToken').
 * 2. `user`: User details (ID, Email, Roles) decoded from the token.
 * 3. `permissions`: Object defining what the user can do (fetched from backend).
 * 
 * 🔄 KEY FLOWS:
 * - `login(email, password)`: Calls API, saves token, fetches permissions.
 * - `fetchPermissions(token)`: Loads permissions from backend. Called on login and window focus.
 * - `logout()`: Clears all state and storage.
 */
export const AuthProvider = ({ children }) => {
    // --- STATE INITIALIZATION ---
    // We initialise state from localStorage so data persists on page reload.

    // Authorization Token (JWT)
    const [token, setToken] = useState(() => {
        const storedToken = localStorage.getItem('authToken');
        return storedToken;
    });

    // User Object (contains ID, Email, Roles)
    const [user, setUser] = useState(() => {
        const storedRoles = localStorage.getItem('userRoles');
        if (storedRoles) {
            return { roles: JSON.parse(storedRoles) };
        }
        return null; // Not logged in
    });

    const [loading, setLoading] = useState(true); // Prevents flickering while checking auth state on load

    // User Permissions (fetched from backend)
    const [permissions, setPermissions] = useState(null);

    // API CONFIG: Looks for VITE_API_URL or defaults to localhost
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // --- EFFECT: INITIAL AUTH CHECK ---
    // Runs once when the app mounts.
    useEffect(() => {
        const initAuth = async () => {
            console.log('Auth init effect running. Current token:', token);

            // 1. CHECK FOR GOOGLE LOGIN CALLBACK
            // When Google redirects back, it puts the token in the URL query string.
            const urlParams = new URLSearchParams(window.location.search);
            const urlToken = urlParams.get('token');

            if (urlToken) {
                // If we found a token in the URL, that means Google Login just happened.
                try {
                    const decodedToken = jwtDecode(urlToken);

                    // Normalise Roles: Different identity providers format roles differently.
                    // We check multiple keys to be safe.
                    const roles = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
                        || decodedToken["role"]
                        || decodedToken["roles"]
                        || decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"];
                    const rolesArray = Array.isArray(roles) ? roles : (roles ? [roles] : []);

                    // Save to Storage
                    localStorage.setItem('authToken', urlToken);
                    localStorage.setItem('userRoles', JSON.stringify(rolesArray));

                    // Extract User Info
                    const userEmail = decodedToken.email || decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '';
                    const userId = decodedToken.sub || decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
                    const userName = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decodedToken.name || '';
                    const userPicture = decodedToken.picture || decodedToken['urn:google:picture'] || null;

                    // Update State
                    setToken(urlToken);
                    setUser({ id: userId, email: userEmail, name: userName, roles: rolesArray, picture: userPicture });

                    // Remove token from URL (security & clean URL)
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (err) {
                    console.error('Error processing Google login token:', err);
                }
            }
            else if (token) {
                // 2. CHECK FOR EXISTING LOCAL TOKEN
                // If we already had a token in state/storage, we assume it's valid for now.
                // In a real production app, you might ping an endpoint like /api/auth/me here to verify validity.
            } else {
                // No token found anywhere -> Not logged in.
                localStorage.removeItem('userRoles');
                setUser(null);
            }

            setLoading(false); // App is ready to render
        };
        initAuth();
    }, [token]);

    // --- FETCH PERMISSIONS FUNCTION ---
    // Fetches user permissions from backend after login
    const fetchPermissions = useCallback(async (authToken) => {
        if (!authToken) {
            console.log('🔒 No auth token, clearing permissions');
            setPermissions(null);
            return;
        }

        try {
            console.log('📡 Fetching permissions from backend...');
            const response = await fetch(`${apiBase}/api/user/my-permissions`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (response.ok) {
                const backendPermissions = await response.json();
                console.log('📥 Backend permissions received:', backendPermissions);

                // Convert backend permission strings to frontend structure
                const frontendPermissions = mapBackendPermissionsToFrontend(backendPermissions);
                console.log('✅ Frontend permissions mapped:', frontendPermissions);

                setPermissions(frontendPermissions);
            } else {
                console.error('❌ Failed to fetch permissions:', response.status, response.statusText);
                setPermissions(null);
            }
        } catch (error) {
            console.error('❌ Error fetching permissions:', error);
            setPermissions(null);
        }
    }, [apiBase]);

    // ============================================================================
    // TAB-ISOLATED SESSION - Fetch permissions on focus + periodic refresh
    // ============================================================================
    // Each tab maintains its own independent session
    // Periodic refresh ensures policy changes made in other tabs are reflected
    useEffect(() => {
        if (token && user) {
            console.log('🔄 Token/User changed, fetching permissions for THIS tab...');
            fetchPermissions(token);
        }

        // Refresh permissions when user switches back to this tab
        const handleFocus = () => {
            if (token) {
                console.log('👀 Tab focused, refreshing permissions...');
                fetchPermissions(token);
            }
        };

        // ============================================================================
        // PERIODIC PERMISSION REFRESH
        // ============================================================================
        // Auto-refresh permissions every 10 seconds to detect policy changes
        // This ensures if SuperAdmin changes policies, other tabs pick it up
        // refreshInterval = setInterval(() => {
        //     console.log('🔄 Auto-refreshing permissions (policy sync)...');
        //     fetchPermissions(token);
        // }, 10000); // 10 seconds

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
            // if (refreshInterval) {
            //     clearInterval(refreshInterval);
            // }
        };
    }, [token, user, fetchPermissions]);

    // --- LOGIN FUNCTION ---
    // Called by LoginForm.jsx
    const login = async (email, password) => {
        try {
            console.log('Attempting login for:', email);

            // 1. Call Backend API
            const response = await fetch(`${apiBase}/api/UserAuth/Login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            // 2. Handle Success
            if (data.success) {
                // Save Token & Roles
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userRoles', JSON.stringify(data.roles));

                // Decode Token to get User Details immediately
                const decodedToken = jwtDecode(data.token);
                const userEmail = decodedToken.email;
                const userId = decodedToken.sub || decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
                const userName = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decodedToken.name || '';
                const userPicture = decodedToken.picture || null;

                // Update State
                setToken(data.token);
                setUser({ id: userId, email: userEmail, name: userName, roles: data.roles, picture: userPicture });

                // Fetch permissions from backend
                await fetchPermissions(data.token);

                return { success: true };
            } else {
                // 3. Handle Failure
                return { success: false, message: data.message || 'Invalid credentials' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error. Check backend server.' };
        }
    };

    // --- LOGOUT FUNCTION ---
    // Clears all authentication data.
    const logout = () => {
        console.log('Logging out.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRoles');
        setToken(null);
        setUser(null);
        setPermissions(null); // Clear permissions on logout
    };

    const value = {
        token,      // Current JWT
        user,       // Current User Info
        permissions, // User Permissions (from backend)
        loading,    // Is App Initialising?
        login,      // Login Method
        logout,     // Logout Method
        apiBase,    // API URL helper
        fetchPermissions // Expose for manual refresh if needed
    };

    // Prevent rendering children until we've checked for a token
    if (loading) {
        return <div>Loading...</div>; // Could replace with a nice spinner
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};