// src/context/AuthContext.tsx
// ==============================================================================
// AUTHENTICATION CONTEXT (Global State)
// ==============================================================================
// This file manages the "who is logged in" state for the entire application.
// It provides:
// 1. `token`: The JWT string used for API authentication.
// 2. `refreshToken`: The token used to refresh the access token.
// 3. `user`: An object containing user details and roles.
// 4. `login(email, password)`: Function to call the backend login API.
// 5. `logout()`: Function to clear state and sign out.
//
// HOW IT WORKS:
// - On app start, it checks `localStorage` for an existing token.
// - If found, it decodes the token to restore the user's session.
// - It uses a centralized `api` service (axios) which handles token refresh automatically.

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { mapBackendPermissionsToFrontend } from '../utils/permissionMapper';
import api from '../services/api';
import type {
    User,
    DecodedToken,
    Permissions,
    AuthContextValue,
    LoginResult,
    LoginResponse,
    PermissionsResponse
} from '../types';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
    const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('refreshToken'));
    const [user, setUser] = useState<User | null>(() => {
        const storedRoles = localStorage.getItem('userRoles');
        if (storedRoles) {
            return { id: '', email: '', roles: JSON.parse(storedRoles) };
        }
        return null;
    });

    const [loading, setLoading] = useState<boolean>(true);
    const [permissions, setPermissions] = useState<Permissions | null>(null);

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const logout = useCallback((): void => {
        console.log('Logging out.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRoles');
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        setPermissions(null);
    }, []);

    const fetchPermissions = useCallback(async (authToken: string): Promise<void> => {
        if (!authToken) {
            setPermissions(null);
            return;
        }

        try {
            const response = await api.get<PermissionsResponse>(`/api/user/my-permissions`);
            if (response.status === 200) {
                const backendPermissions = response.data.data || [];
                const frontendPermissions = mapBackendPermissionsToFrontend(backendPermissions);
                setPermissions(frontendPermissions);
            }
        } catch (error) {
            console.error('❌ Error fetching permissions:', error);
            setPermissions(null);
        }
    }, []);

    const fetchUserProfile = useCallback(async (authToken: string): Promise<void> => {
        if (!authToken) return;

        try {
            const response = await api.get('/api/user/profile');
            if (response.status === 200) {
                const profileData = response.data.data;
                setUser(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        branchName: profileData.branchName,
                        name: profileData.userName || profileData.name || prev.name
                    };
                });
            }
        } catch (error) {
            console.error('❌ Error fetching user profile:', error);
        }
    }, []);

    useEffect(() => {
        const initAuth = async (): Promise<void> => {
            const urlParams = new URLSearchParams(window.location.search);
            const urlToken = urlParams.get('token');
            const urlRefreshToken = urlParams.get('refreshToken');

            if (urlToken) {
                try {
                    const decodedToken = jwtDecode<DecodedToken>(urlToken);
                    const roles = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
                        || decodedToken["role"]
                        || decodedToken["roles"]
                        || decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"];
                    const rolesArray = Array.isArray(roles) ? roles : (roles ? [roles] : []);

                    localStorage.setItem('authToken', urlToken);
                    if (urlRefreshToken) localStorage.setItem('refreshToken', urlRefreshToken);
                    localStorage.setItem('userRoles', JSON.stringify(rolesArray));

                    const userEmail = decodedToken.email || decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '';
                    const userId = decodedToken.sub || decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
                    const userName = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decodedToken.name || '';
                    const userPicture = decodedToken.picture || null;
                    const branchName = (decodedToken as any).branchName || (decodedToken as any).BranchName || '';

                    setToken(urlToken);
                    setRefreshToken(urlRefreshToken);
                    setUser({ id: userId, email: userEmail, name: userName, roles: rolesArray, picture: userPicture, branchName });

                    fetchUserProfile(urlToken);
                    window.history.replaceState({}, document.title, window.location.pathname);
                } catch (err) {
                    console.error('Error processing login token:', err);
                }
            } else if (token) {
                fetchUserProfile(token);
            }

            setLoading(false);
        };
        initAuth();
    }, [token, fetchUserProfile]);

    useEffect(() => {
        if (token && user) {
            fetchPermissions(token);
        }

        const handleFocus = (): void => {
            if (token) fetchPermissions(token);
        };

        const refreshInterval = setInterval(() => {
            if (token) fetchPermissions(token);
        }, 10000);

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
            clearInterval(refreshInterval);
        };
    }, [token, user, fetchPermissions]);

    const login = async (email: string, password: string): Promise<LoginResult> => {
        try {
            const response = await api.post<LoginResponse>(`/api/UserAuth/Login`, { email, password });
            const res = response.data;

            if (res.success && res.data?.token) {
                const { token: authToken, refreshToken: newRefreshToken, roles } = res.data;

                localStorage.setItem('authToken', authToken);
                localStorage.setItem('refreshToken', newRefreshToken);
                localStorage.setItem('userRoles', JSON.stringify(roles));

                const decodedToken = jwtDecode<DecodedToken>(authToken);
                const userEmail = decodedToken.email || '';
                const userId = decodedToken.sub || '';
                const userName = decodedToken.name || '';
                const userPicture = decodedToken.picture || null;
                const branchName = (decodedToken as any).branchName || '';

                setToken(authToken);
                setRefreshToken(newRefreshToken);
                setUser({ id: userId, email: userEmail, name: userName, roles: roles, picture: userPicture, branchName });

                fetchUserProfile(authToken);
                await fetchPermissions(authToken);

                return { success: true };
            } else {
                return { success: false, message: res.message || 'Invalid credentials' };
            }
        } catch (error: any) {
            console.error('Login error:', error);
            return { success: false, message: error.response?.data?.message || 'Network error' };
        }
    };

    const value: AuthContextValue = {
        token,
        refreshToken,
        user,
        permissions,
        loading,
        login,
        logout,
        apiBase,
        fetchPermissions
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">Loading session...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
