import * as SidebarIcons from '../components/dashboard/SidebarIcons.jsx';

/**
 * Maps a list of backend menu items (MenuItem entities) to the frontend Sidebar item structure.
 * 
 * @param {Array} backendItems - List of items from API
 * @returns {Array} Formatted menu items for Sidebar component
 */
export const mapBackendMenuToSidebar = (backendItems) => {
    if (!backendItems) return [];

    return backendItems.map(item => {
        // Map the structure
        const sidebarItem = {
            id: item.viewId, // Backend: ViewId -> Frontend: id
            title: item.title,
            icon: item.icon ? SidebarIcons[item.icon] : null, // Resolve Icon Component
            permission: item.permission, // Pass through permission key
            disabled: !item.isVisible, // Map visibility to disabled or filter out? 
        };

        // Recursively map children
        if (item.children && item.children.length > 0) {
            sidebarItem.children = mapBackendMenuToSidebar(item.children); // Recurse
        }

        return sidebarItem;
    }).filter(item => !item.disabled); // Filter out hidden items if desired
};

/**
 * Filters the menu items based on the user's permissions.
 * 
 * @param {Array} items - Menu items (Sidebar format)
 * @param {Object} permissions - User permissions object
 * @param {Object} user - User object to check for SuperAdmin role
 * @returns {Array} Filtered menu items
 */
export const filterDynamicMenus = (items, permissions, user) => {
    // SuperAdmin sees EVERYTHING
    if (user && user.roles && (user.roles.includes('SuperAdmin') || user.roles.includes('Super Admin'))) {
        return items;
    }

    if (!permissions) return [];

    return items.reduce((acc, item) => {
        // Check if the item itself is permitted
        const isPermitted = (!item.permission) || (permissions[item.permission] === true) || (item.permission === 'dashboard');

        if (isPermitted) {
            let newItem = { ...item };

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
 * 
 * @param {string} apiBase - Base API URL
 * @param {string} token - Auth Token
 * @returns {Promise<Array>} List of raw backend menu items
 */
export const fetchDynamicMenu = async (apiBase, token) => {
    try {
        // Ensure apiBase doesn't have a trailing slash for consistency
        const baseUrl = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
        const response = await fetch(`${baseUrl}/api/menu`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error("Failed to fetch menu:", response.status);
            return [];
        }
    } catch (error) {
        console.error("Error fetching menu:", error);
        return [];
    }
};
