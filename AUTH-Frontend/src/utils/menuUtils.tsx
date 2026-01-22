import * as SidebarIcons from '../components/dashboard/SidebarIcons';
import { SidebarItem, Permissions, User } from '../types';

/**
 * Maps a list of backend menu items (MenuItem entities) to the frontend Sidebar item structure.
 */
export const mapBackendMenuToSidebar = (backendItems: any[]): SidebarItem[] => {
    if (!backendItems || !Array.isArray(backendItems)) {
        console.warn("mapBackendMenuToSidebar: expected array, got:", backendItems);
        return [];
    }

    return backendItems.map(item => {
        // Map the structure
        const sidebarIconsTyped = SidebarIcons as Record<string, any>;
        const sidebarItem: SidebarItem = {
            id: item.viewId, // Backend: ViewId -> Frontend: id
            label: item.title,
            icon: item.icon ? sidebarIconsTyped[item.icon] : null, // Resolve Icon Component
            permission: item.permission, // Pass through permission key
            url: item.url, // Map URL from backend (e.g., '/kyc', '/users')
        };

        // Recursively map children
        if (item.children && item.children.length > 0) {
            sidebarItem.children = mapBackendMenuToSidebar(item.children); // Recurse
        }

        return sidebarItem;
    }).filter(item => item.id); // Filter out items without ID
};

/**
 * Filters the menu items based on the user's permissions.
 */
export const filterDynamicMenus = (items: SidebarItem[], permissions: Permissions | null, user: User | null): SidebarItem[] => {
    // SuperAdmin sees EVERYTHING
    if (user && user.roles && (user.roles.includes('SuperAdmin') || user.roles.includes('Super Admin'))) {
        return items;
    }

    if (!permissions) return [];

    return items.reduce((acc: SidebarItem[], item: SidebarItem) => {
        // Check if the item itself is permitted
        // 1. Dashboard is always allowed.
        // 2. If 'item.permission' is null, it's allowed.
        // 3. If 'item.permission' exists, check if it exists in 'permissions' object.
        // NOTE: permissions[item.permission] might be a boolean (legacy/flat) or an object (new granular).
        // Since the sidebar mainly cares about listing items, we check usage in permissionMapper:
        // 'view_users', 'view_projects' are booleans. 'users', 'projects' are objects.
        // Sidebar items in DB usually store the boolean key e.g. 'view_users'.

        let isPermitted = false;
        if (!item.permission || item.permission === 'dashboard' || item.permission === 'Permissions.Kyc.Dashboard') {
            isPermitted = true;
        } else {
            // Priority 1: Direct Match (Raw Backend Key)
            // This is the most reliable as it matches EXACTLY what the Policy Editor saves.
            const rawValue = (permissions as any)[item.permission];

            // Priority 2: Granular Object Match (Structured Frontend State)
            // Example: item.permission is 'Permissions.Users.Sidebar' -> map to permissions.users.sidebar
            const moduleName = item.permission.split('.')[1]?.toLowerCase();
            const granularValue = moduleName ? (permissions as any)[moduleName] : null;

            if (rawValue === true) {
                isPermitted = true;
            } else if (granularValue && typeof granularValue === 'object') {
                if (granularValue.sidebar === true || granularValue.read === true) {
                    isPermitted = true;
                }
            } else {
                // Priority 3: Standardised Alias Fallback (view_*)
                // Example: 'Permissions.Users.Sidebar' -> 'view_users'
                const viewKey = moduleName ? `view_${moduleName}` : null;
                if (viewKey && (permissions as any)[viewKey] === true) {
                    isPermitted = true;
                }
            }
        }

        if (isPermitted) {
            const newItem = { ...item };

            // If it has children, filter them too
            if (newItem.children && newItem.children.length > 0) {
                newItem.children = filterDynamicMenus(newItem.children, permissions, user);
            }

            acc.push(newItem);
        }
        return acc;
    }, []);
};

/**
 * Fetches the menu items from the backend API.
 */
export const fetchDynamicMenu = async (apiBase: string, token: string): Promise<any[]> => {
    try {
        // Ensure apiBase doesn't have a trailing slash for consistency
        const baseUrl = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
        const response = await fetch(`${baseUrl}/api/menu`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const res = await response.json();
            return res.data || [];
        } else {
            if (response.status === 401) {
                // Return empty but don't log as much - AuthContext will handle logout
                console.warn("fetchDynamicMenu: Unauthorized (401). Stale token detected.");
            } else {
                console.error("Failed to fetch menu:", response.status);
            }
            return [];
        }
    } catch (error) {
        console.error("Error fetching menu:", error);
        return [];
    }
};
