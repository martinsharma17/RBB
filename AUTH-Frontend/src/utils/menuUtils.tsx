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
        if (!item.permission || item.permission === 'dashboard') {
            isPermitted = true;
        } else {
            // 1. Check if the permission string itself exists as a key (Legacy/Flat)
            const permValue = (permissions as any)[item.permission];

            // 2. Map backend strings to frontend granular keys
            const kycSidebarKey = 'Permissions.Kyc.Sidebar';
            const kycWorkflowKey = 'Permissions.Kyc.Workflow';
            const usersSidebarKey = 'Permissions.Users.Sidebar';

            if (permValue === true) {
                isPermitted = true;
            } else if (typeof permValue === 'object' && permValue !== null) {
                if (permValue.sidebar === true || permValue.read === true) {
                    isPermitted = true;
                }
            } else if (item.permission === kycSidebarKey && (permissions as any).kyc?.sidebar) {
                isPermitted = true;
            } else if (item.permission === kycWorkflowKey && (permissions as any).kyc_workflow?.sidebar) {
                isPermitted = true;
            } else if (item.permission === usersSidebarKey && (permissions as any).users?.sidebar) {
                isPermitted = true;
            } else {
                // Fallback: search for any key starting with 'view_' that might match
                // Most items follow the pattern: Permissions.Modules.Sidebar -> view_modules
                const parts = item.permission.split('.');
                if (parts && parts.length >= 3 && parts[1]) {
                    const moduleName = parts[1].toLowerCase();
                    const viewKey = `view_${moduleName}`;
                    if ((permissions as any)[viewKey] === true) {
                        isPermitted = true;
                    } else if ((permissions as any)[moduleName]?.sidebar === true) {
                        isPermitted = true;
                    }
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
            console.error("Failed to fetch menu:", response.status);
            return [];
        }
    } catch (error) {
        console.error("Error fetching menu:", error);
        return [];
    }
};
