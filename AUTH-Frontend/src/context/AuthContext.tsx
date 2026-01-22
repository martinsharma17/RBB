// src/context/AuthContext.tsx
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

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { mapBackendPermissionsToFrontend } from "../utils/permissionMapper";
import type {
  User,
  DecodedToken,
  Permissions,
  AuthContextValue,
  LoginResult,
  LoginResponse,
  PermissionsResponse,
} from "../types";

// Create the context object
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Custom Hook for consistent access
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
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

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // --- STATE INITIALIZATION ---
  // We initialise state from localStorage so data persists on page reload.

  // Authorization Token (JWT)
  const [token, setToken] = useState<string | null>(() => {
    const storedToken = localStorage.getItem("authToken");
    return storedToken;
  });

  // User Object (contains ID, Email, Roles)
  const [user, setUser] = useState<User | null>(() => {
    const storedRoles = localStorage.getItem("userRoles");
    if (storedRoles) {
      return { id: "", email: "", roles: JSON.parse(storedRoles) };
    }
    return null; // Not logged in
  });

  const [loading, setLoading] = useState<boolean>(true); // Prevents flickering while checking auth state on load

  // User Permissions (fetched from backend)
  const [permissions, setPermissions] = useState<Permissions | null>(null);

  // API CONFIG: Looks for VITE_API_URL or defaults to localhost
  const apiBase = import.meta.env.VITE_API_URL || "https://localhost:7153";

  // --- EFFECT: INITIAL AUTH CHECK ---
  // Runs once when the app mounts.
  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      console.log("Auth init effect running. Current token:", token);

      // 1. CHECK FOR GOOGLE LOGIN CALLBACK
      // When Google redirects back, it puts the token in the URL query string.
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");

      if (urlToken) {
        // If we found a token in the URL, that means Google Login just happened.
        try {
          const decodedToken = jwtDecode<DecodedToken>(urlToken);

          // Normalise Roles: Different identity providers format roles differently.
          // We check multiple keys to be safe.
          const roles =
            decodedToken[
              "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            ] ||
            decodedToken["role"] ||
            decodedToken["roles"] ||
            decodedToken[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"
            ];
          const rolesArray = Array.isArray(roles)
            ? roles
            : roles
              ? [roles]
              : [];

          // Save to Storage
          localStorage.setItem("authToken", urlToken);
          localStorage.setItem("userRoles", JSON.stringify(rolesArray));

                setPermissions(frontendPermissions);
            } else {
                console.error('❌ Failed to fetch permissions:', response.status, response.statusText);
                if (response.status === 401) {
                    console.log('🚪 Session expired (401), logging out...');
                    logout();
                }
                setPermissions(null);
            }
        } catch (error) {
            console.error('❌ Error fetching permissions:', error);
            setPermissions(null);
        }
    }, [apiBase, logout]);

    // --- FETCH USER PROFILE FUNCTION ---
    const fetchUserProfile = useCallback(async (authToken: string): Promise<void> => {
        if (!authToken) return;

        try {
            const response = await fetch(`${apiBase}/api/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (response.ok) {
                const res = await response.json();
                const profileData = res.data;
                console.log('📥 User profile received:', profileData);

                setUser(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        branchName: profileData.branchName,
                        name: profileData.userName || profileData.name || prev.name
                    };
                });
            } else if (response.status === 401) {
                console.log('🚪 Session expired (401), logging out...');
                logout();
            }
        } catch (error) {
            console.error('❌ Error fetching user profile:', error);
        }
    }, [apiBase, logout]);

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
        const handleFocus = (): void => {
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
        const refreshInterval = setInterval(() => {
            if (token) {
                console.log('🔄 Auto-refreshing permissions (policy sync)...');
                fetchPermissions(token);
            }
        }, 10000); // 10 seconds

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [token, user, fetchPermissions]);

    // --- LOGIN FUNCTION ---
    // Called by LoginForm.tsx
    const login = async (email: string, password: string): Promise<LoginResult> => {
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

            const res: LoginResponse = await response.json();

            // 2. Handle Success
            if (res.success && res.data?.token && res.data?.roles) {
                const { token: authToken, roles } = res.data;

                // Save Token & Roles
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('userRoles', JSON.stringify(roles));

                // Decode Token to get User Details immediately
                const decodedToken = jwtDecode<DecodedToken>(authToken);
                const userEmail = decodedToken.email || '';
                const userId = decodedToken.sub || decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
                const userName = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decodedToken.name || '';
                const userPicture = decodedToken.picture || null;
                const branchName = (decodedToken as any).branchName || (decodedToken as any).BranchName || '';

                // Update State
                setToken(authToken);
                setUser({ id: userId, email: userEmail, name: userName, roles: roles, picture: userPicture, branchName });

                // [NEW] Fetch full profile to get latest branch info
                fetchUserProfile(authToken);

                // Fetch permissions from backend
                await fetchPermissions(authToken);

                return { success: true };
            } else {
                // 3. Handle Failure
                return { success: false, message: res.message || 'Invalid credentials' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error. Check backend server.' };
        }
    };

    const value: AuthContextValue = {
        token,      // Current JWT
        user,       // Current User Info
        permissions, // User Permissions (from backend)
        loading,    // Is App Initialising?
        login,      // Login Method
        logout,     // Logout Method
        apiBase,    // API URL helper
        fetchPermissions // Expose for manual refresh if needed
    };
    initAuth();
  }, [token]);

  // --- FETCH PERMISSIONS FUNCTION ---
  // Fetches user permissions from backend after login
  const fetchPermissions = useCallback(
    async (authToken: string): Promise<void> => {
      if (!authToken) {
        console.log("🔒 No auth token, clearing permissions");
        setPermissions(null);
        return;
      }

      try {
        console.log("📡 Fetching permissions from backend...");
        const response = await fetch(`${apiBase}/api/user/my-permissions`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const res: PermissionsResponse = await response.json();
          const backendPermissions = res.data || [];
          console.log("📥 Backend permissions received:", backendPermissions);

          // Convert backend permission strings to frontend structure
          const frontendPermissions =
            mapBackendPermissionsToFrontend(backendPermissions);
          console.log("✅ Frontend permissions mapped:", frontendPermissions);

          setPermissions(frontendPermissions);
        } else {
          console.error(
            "❌ Failed to fetch permissions:",
            response.status,
            response.statusText,
          );
          setPermissions(null);
        }
      } catch (error) {
        console.error("❌ Error fetching permissions:", error);
        setPermissions(null);
      }
    },
    [apiBase],
  );

  // --- FETCH USER PROFILE FUNCTION ---
  const fetchUserProfile = useCallback(
    async (authToken: string): Promise<void> => {
      if (!authToken) return;

      try {
        const response = await fetch(`${apiBase}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const res = await response.json();
          const profileData = res.data;
          console.log("📥 User profile received:", profileData);

          setUser((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              branchName: profileData.branchName,
              name: profileData.userName || profileData.name || prev.name,
            };
          });
        }
      } catch (error) {
        console.error("❌ Error fetching user profile:", error);
      }
    },
    [apiBase],
  );

  // ============================================================================
  // TAB-ISOLATED SESSION - Fetch permissions on focus + periodic refresh
  // ============================================================================
  // Each tab maintains its own independent session
  // Periodic refresh ensures policy changes made in other tabs are reflected
  useEffect(() => {
    if (token && user) {
      console.log(
        "🔄 Token/User changed, fetching permissions for THIS tab...",
      );
      fetchPermissions(token);
    }

    // Refresh permissions when user switches back to this tab
    const handleFocus = (): void => {
      if (token) {
        console.log("👀 Tab focused, refreshing permissions...");
        fetchPermissions(token);
      }
    };

    // ============================================================================
    // PERIODIC PERMISSION REFRESH
    // ============================================================================
    // Auto-refresh permissions every 10 seconds to detect policy changes
    // This ensures if SuperAdmin changes policies, other tabs pick it up
    const refreshInterval = setInterval(() => {
      if (token) {
        console.log("🔄 Auto-refreshing permissions (policy sync)...");
        fetchPermissions(token);
      }
    }, 10000); // 10 seconds

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [token, user, fetchPermissions]);

  // --- LOGIN FUNCTION ---
  // Called by LoginForm.tsx
  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    try {
      console.log("Attempting login for:", email);

      // 1. Call Backend API
      const response = await fetch(`${apiBase}/api/UserAuth/Login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const res: LoginResponse = await response.json();

      // 2. Handle Success
      if (res.success && res.data?.token && res.data?.roles) {
        const { token: authToken, roles } = res.data;

        // Save Token & Roles
        localStorage.setItem("authToken", authToken);
        localStorage.setItem("userRoles", JSON.stringify(roles));

        // Decode Token to get User Details immediately
        const decodedToken = jwtDecode<DecodedToken>(authToken);
        const userEmail = decodedToken.email || "";
        const userId =
          decodedToken.sub ||
          decodedToken[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
          ] ||
          "";
        const userName =
          decodedToken[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
          ] ||
          decodedToken.name ||
          "";
        const userPicture = decodedToken.picture || null;
        const branchName =
          (decodedToken as any).branchName ||
          (decodedToken as any).BranchName ||
          "";

        // Update State
        setToken(authToken);
        setUser({
          id: userId,
          email: userEmail,
          name: userName,
          roles: roles,
          picture: userPicture,
          branchName,
        });

        // [NEW] Fetch full profile to get latest branch info
        fetchUserProfile(authToken);

        // Fetch permissions from backend
        await fetchPermissions(authToken);

        return { success: true };
      } else {
        // 3. Handle Failure
        return {
          success: false,
          message: res.message || "Invalid credentials",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Network error. Check backend server.",
      };
    }
  };

  // --- LOGOUT FUNCTION ---
  // Clears all authentication data.
  const logout = (): void => {
    console.log("Logging out.");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRoles");
    setToken(null);
    setUser(null);
    setPermissions(null); // Clear permissions on logout
  };

  const value: AuthContextValue = {
    token, // Current JWT
    user, // Current User Info
    permissions, // User Permissions (from backend)
    loading, // Is App Initialising?
    login, // Login Method
    logout, // Logout Method
    apiBase, // API URL helper
    fetchPermissions, // Expose for manual refresh if needed
  };

  // Prevent rendering children until we've checked for a token
  if (loading) {
    return <div>Loading...</div>; // Could replace with a nice spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
