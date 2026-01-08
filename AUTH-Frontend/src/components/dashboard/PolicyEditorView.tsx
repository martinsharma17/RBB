// src/components/dashboard/PolicyEditorView.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mapBackendPermissionsToFrontend, mapFrontendPermissionsToBackend } from '../../utils/permissionMapper';

/**
 * PolicyEditorView Component
 * 
 * Refactored to a master-detail split view to eliminate excessive scrolling.
 * Left Sidebar: Select Role.
 * Main Panel: Configure Permissions for selected Role.
 * 
 * Now integrated with backend API for real-time permission updates.
 */
interface PolicyEditorViewProps {
    roles: any[];
    onPermissionsUpdated?: () => void;
}

const PolicyEditorView: React.FC<PolicyEditorViewProps> = ({ roles, onPermissionsUpdated }) => {
    const { token, apiBase } = useAuth();

    /**
     * ===================================================================================
     * 🛠️ DEVELOPER GUIDE: POLICY EDITOR RESOURCES
     * ===================================================================================
     * 
     * This list defines the rows in the Policy Editor table.
     * 
     * ➕ HOW TO ADD A NEW RESOURCE ROW:
     * 1. Add a new object to the `resources` array below.
     *    { id: 'new_id', name: 'Display Name' }
     * 
     * 🔗 CONNECTING TO PERMISSIONS:
     * The `id` here (e.g., 'users') must match the key in `permissionMapper.js`.
     * The mapper handles converting `users.create` -> `Permissions.Users.Create`.
     * 
     * 🌳 PARENT-CHILD RELATIONSHIPS:
     * To make a row indented (child), add `parent: 'parent_id'`.
     * Example: { id: 'task_list', name: 'List', parent: 'tasks' }
     * ===================================================================================
     */
    const resources = [
        { id: 'users', name: 'Users & Admins' },
        { id: 'roles', name: 'Roles & Permissions' },
        { id: 'policies', name: 'Policy Editor' },
        { id: 'charts', name: 'Charts & Analytics' },
        { id: 'settings', name: 'Settings' },
        { id: 'branches', name: 'Branch Management' },

        // Projects & Nested Resources
        { id: 'projects', name: 'Projects (Root)' },
        { id: 'my_projects', name: 'My Projects', parent: 'projects' },
        { id: 'project_content', name: 'Project Content', parent: 'my_projects' },
        { id: 'project_team', name: 'Team & Workflow', parent: 'project_content' },
        { id: 'project_settings', name: 'Project Settings', parent: 'project_team' },

        { id: 'tasks', name: 'Tasks (Overview)' },
        { id: 'task_list', name: 'List', parent: 'tasks' }, // Child of tasks
        { id: 'task_kanban', name: 'Kanban', parent: 'tasks' }, // Child of tasks
        { id: 'reports', name: 'Reports' },
        { id: 'audit', name: 'Audit Logs' },
        { id: 'notifications', name: 'Notifications' },
        { id: 'kyc', name: 'KYC Verification' },
        { id: 'kyc_workflow', name: 'KYC Approval Queue' },
        { id: 'kyc_unified_queue', name: 'Unified KYC Queue' },
        { id: 'security', name: 'Security' },
        { id: 'backup', name: 'Backup & Restore' }
    ];

    // Available Actions
    const actions = [
        { id: 'create', name: 'Create', color: 'bg-purple-100 text-purple-700' },
        { id: 'read', name: 'Read', color: 'bg-blue-100 text-blue-700' },
        { id: 'update', name: 'Update', color: 'bg-orange-100 text-orange-700' },
        { id: 'delete', name: 'Delete', color: 'bg-red-100 text-red-700' },
        { id: 'sidebar', name: 'Sidebar', color: 'bg-green-100 text-green-700' }
    ];

    const [policies, setPolicies] = useState<Record<string, Record<string, any>>>({});
    const [loading, setLoading] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [activeRole, setActiveRole] = useState<string | null>(null);

    // Filter editable roles (exclude SuperAdmin)
    const editableRoles = roles.filter(r => {
        const rName = r.Name || r.name || r;
        return rName !== 'SuperAdmin';
    });

    // EFFECT: Set initial active role ONLY ONCE
    useEffect(() => {
        if (editableRoles.length > 0 && !activeRole) {
            const firstRoleName = editableRoles[0].Name || editableRoles[0].name || editableRoles[0];
            setActiveRole(firstRoleName);
        }
    }, [roles]); // Re-run only if roles list actually changes (e.g. from Dashboard)

    // EFFECT: Lazy load policies for the active role
    useEffect(() => {
        if (!activeRole || !token) return;

        // Skip if already loaded in local state
        if (policies[activeRole]) return;

        const fetchRolePolicies = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${apiBase}/api/policies/${activeRole}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const res = await response.json();
                    const data = res.data || {};
                    const backendPermissions = data.permissions || data.Permissions || [];
                    const frontendPermissions = mapBackendPermissionsToFrontend(backendPermissions);
                    const resourceFormat = convertToResourceFormat(frontendPermissions);

                    setPolicies((prev: Record<string, Record<string, any>>) => ({
                        ...prev,
                        [activeRole]: resourceFormat
                    }));
                } else {
                    // Initialize empty for this role
                    const emptyPolicy: Record<string, any> = {};
                    resources.forEach(res => {
                        const actPolicy: Record<string, boolean> = {};
                        actions.forEach(act => {
                            actPolicy[act.id] = false;
                        });
                        emptyPolicy[res.id] = actPolicy;
                    });
                    setPolicies((prev: Record<string, Record<string, any>>) => ({
                        ...prev,
                        [activeRole]: emptyPolicy
                    }));
                }
            } catch (error) {
                console.error(`Error fetching policies for ${activeRole}:`, error);
            } finally {
                setLoading(false);
            }
        };

        fetchRolePolicies();
    }, [activeRole, token, apiBase]);

    const convertToResourceFormat = (frontendPermissions: any) => {
        const resourceFormat: Record<string, any> = {};

        resources.forEach(res => {
            // Check both nested object format (users.create) and flat format (create_users)
            const nestedPerms = frontendPermissions[res.id] || {};

            resourceFormat[res.id] = {
                create: nestedPerms.create || frontendPermissions[`create_${res.id}`] || false,
                read: nestedPerms.read || frontendPermissions[`read_${res.id}`] || frontendPermissions[`view_${res.id}`] || false,
                update: nestedPerms.update || frontendPermissions[`update_${res.id}`] || false,
                delete: nestedPerms.delete || frontendPermissions[`delete_${res.id}`] || false,
                sidebar: nestedPerms.sidebar || frontendPermissions[`sidebar_${res.id}`] || frontendPermissions[`view_${res.id}`] || false
            };
        });

        return resourceFormat;
    };

    const handlePermissionChange = (roleName: string, resourceId: string, actionId: string) => {
        setPolicies((prev: Record<string, Record<string, any>>) => {
            const rolePolicy = prev[roleName] || {};

            // Deep copy specific role policy to avoid mutation issues
            const newRolePolicy = JSON.parse(JSON.stringify(rolePolicy));

            // Initialize resource policy if missing
            if (!newRolePolicy[resourceId]) newRolePolicy[resourceId] = {};

            const currentVal = newRolePolicy[resourceId][actionId];
            const newVal = !currentVal;

            newRolePolicy[resourceId][actionId] = newVal;

            // Cascading Logic for Sidebar Visibility
            if (actionId === 'sidebar') {
                const targetResource = resources.find(r => r.id === resourceId);

                // 1. Parent OFF -> Turn OFF all Children
                if (newVal === false) {
                    const children = resources.filter(r => r.parent === resourceId);
                    children.forEach(child => {
                        if (!newRolePolicy[child.id]) newRolePolicy[child.id] = {};
                        newRolePolicy[child.id].sidebar = false;
                    });
                }

                // 2. Child ON -> Turn ON Parent
                if (newVal === true && targetResource?.parent) {
                    if (!newRolePolicy[targetResource.parent]) newRolePolicy[targetResource.parent] = {};
                    newRolePolicy[targetResource.parent].sidebar = true;
                }
            }

            return {
                ...prev,
                [roleName]: newRolePolicy
            };
        });
    };

    const handleSave = async () => {
        setSaveMessage("Saving...");
        let successCount = 0;
        let errorCount = 0;

        if (!token) {
            setSaveMessage("❌ Error: Not authenticated.");
            return;
        }

        try {
            // Save each role's permissions to backend
            for (const roleName of Object.keys(policies)) {
                const rolePolicy = policies[roleName];
                if (!rolePolicy) continue;

                // Convert resource-based format to backend permission array
                const backendPermissions = convertResourceFormatToBackend(rolePolicy);

                console.log(`📤 Sending permissions for ${roleName}:`, backendPermissions);
                console.log(`   Total permissions: ${backendPermissions.length}`);

                const response = await fetch(`${apiBase}/api/policies/${roleName}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(backendPermissions)
                });

                if (response.ok) {
                    const result = await response.json();
                    const savedCount = result.data?.count ?? result.data?.Count ?? 0;
                    console.log(`✅ ${roleName}: ${result.message || 'Success'} (Synced: ${savedCount})`);

                    if (backendPermissions.length > 0 && savedCount === 0) {
                        console.warn(`⚠ Role ${roleName} sent ${backendPermissions.length} permissions but server saved 0. Key mismatch?`);
                    }
                    successCount++;
                } else {
                    errorCount++;
                    const errorText = await response.text();
                    console.error(`❌ Failed to save permissions for ${roleName}:`, response.status, errorText);
                }
            }

            if (errorCount === 0) {
                setSaveMessage(`✓ Policies saved successfully! ${successCount} role(s) updated. Changes will apply on next page refresh.`);

                // Trigger permission refresh callback if provided
                if (onPermissionsUpdated) {
                    onPermissionsUpdated();
                }
            } else {
                setSaveMessage(`⚠ Partially saved: ${successCount} succeeded, ${errorCount} failed. Check console for details.`);
            }
        } catch (error) {
            console.error('Error saving policies:', error);
            setSaveMessage("❌ Error saving policies. Please try again.");
        }

        setTimeout(() => setSaveMessage(""), 5000);
    };

    // Helper: Convert resource-based format to backend permission array
    const convertResourceFormatToBackend = (resourcePolicy: Record<string, any>) => {
        const frontendPermissions: Record<string, any> = {};

        // Convert resource format to nested frontend format that mapper expects
        Object.keys(resourcePolicy).forEach(resourceId => {
            const perms = resourcePolicy[resourceId];

            // Create nested object for each resource
            frontendPermissions[resourceId] = {
                create: perms.create || false,
                read: perms.read || false,
                update: perms.update || false,
                delete: perms.delete || false,
                sidebar: perms.sidebar || false
            };
        });

        // Use mapper to convert to backend format
        return mapFrontendPermissionsToBackend(frontendPermissions);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Configuration...</div>;
    if (editableRoles.length === 0) return <div className="p-8 text-center text-gray-500">No editable roles found.</div>;

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Policy Editor</h2>
                    <p className="text-gray-500 mt-1">Manage dynamic role-based access control.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                    <span>Save Changes</span>
                </button>
            </div>

            {/* Tip Banner */}
            <div className="flex-shrink-0">
                <div className="text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg border border-green-100 flex items-center gap-2">
                    <span className="font-semibold text-lg">💡</span>
                    <span>
                        Use the <strong>Sidebar</strong> toggle to control menu visibility. Turning off a <strong>Parent</strong> hides its children.
                    </span>
                </div>
            </div>

            {saveMessage && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {saveMessage}
                </div>
            )}

            {/* Main Split Layout */}
            <div className="flex flex-col md:flex-row gap-6 items-start">

                {/* Left Sidebar: Role Selector */}
                <div className="w-full md:w-64 flex-shrink-0 space-y-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">Select Role</h3>
                    <div className="flex flex-col space-y-1">
                        {editableRoles.map(role => {
                            const roleName = role.Name || role.name || role;
                            const isActive = activeRole === roleName;

                            return (
                                <button
                                    key={roleName}
                                    onClick={() => setActiveRole(roleName)}
                                    className={`text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between group ${isActive
                                        ? 'bg-white border text-indigo-700 shadow-sm border-indigo-200 ring-1 ring-indigo-50 font-medium'
                                        : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-indigo-500' : 'bg-gray-300 group-hover:bg-gray-400'}`}></span>
                                        {roleName}
                                    </span>
                                    {isActive && <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Panel: Policy Table */}
                <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
                    {activeRole ? (
                        <>
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded uppercase tracking-wide">Role</span>
                                        {activeRole}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Configure permissions for {activeRole}</p>
                                </div>
                                <div className="text-xs text-gray-400 font-mono">id: {activeRole ? activeRole.toLowerCase().replace(/\s+/g, '_') : ''}</div>
                            </div>

                            <div className="p-0 overflow-x-auto">
                                <table className="w-full min-w-max text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr className="text-left">
                                            <th className="py-3 px-6 font-semibold text-gray-500 uppercase text-xs tracking-wider w-1/3">Resource Name</th>
                                            {actions.map(action => (
                                                <th key={action.id} className="py-3 px-4 font-semibold text-gray-500 uppercase text-xs tracking-wider text-center w-24">
                                                    {action.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {resources.map((resource, idx) => {
                                            // Helper to calculate depth recursively
                                            const getDepth = (id: string, currentDepth: number = 0): number => {
                                                const res = resources.find(r => r.id === id);
                                                if (!res || !res.parent) return currentDepth;
                                                return getDepth(res.parent, currentDepth + 1);
                                            };

                                            const depth = getDepth(resource.id);
                                            const rolePolicy = activeRole ? policies[activeRole] : null;
                                            const resPolicy = rolePolicy ? rolePolicy[resource.id] || {} : {};
                                            const isAlt = idx % 2 === 0;

                                            return (
                                                <tr key={resource.id} className={`group hover:bg-gray-50 transition-colors ${isAlt ? 'bg-white' : 'bg-[rgba(249,250,251,0.5)]'}`}>
                                                    <td className="py-4 px-6 relative">
                                                        {depth > 0 && (
                                                            <div
                                                                className="absolute top-0 bottom-0 w-px bg-gray-200 h-1/2 translate-y-full transform -translate-y-1/2"
                                                                style={{ left: `${depth * 24 + 24}px` }}
                                                            ></div>
                                                        )}
                                                        <div
                                                            className="flex items-center gap-3"
                                                            style={{ paddingLeft: `${depth * 24}px` }}
                                                        >
                                                            {depth > 0 && (
                                                                <span className="text-gray-300 -ml-4">└──</span>
                                                            )}
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors ${depth > 0 ? 'bg-gray-50 scale-90' : 'bg-gray-100'}`}>
                                                                <span className="text-xs font-bold">{resource.name[0]}</span>
                                                            </div>
                                                            <div>
                                                                <p className={`font-medium ${depth > 0 ? 'text-gray-600' : 'text-gray-700'}`}>{resource.name}</p>
                                                                <p className="text-[10px] text-gray-400">id: {resource.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {actions.map(action => {
                                                        // -----------------------------------------------------------------------
                                                        // SPECIAL CASE: 'Tasks' and 'Projects' parents only need Sidebar toggle
                                                        // -----------------------------------------------------------------------
                                                        const isParentOnly = (resource.id === 'tasks' || resource.id === 'projects' || resource.id === 'my_projects');
                                                        if (isParentOnly && action.id !== 'sidebar') {
                                                            return (
                                                                <td key={action.id} className="py-4 px-4 text-center align-middle">
                                                                    <span className="text-gray-300 select-none">-</span>
                                                                </td>
                                                            );
                                                        }

                                                        const isChecked = resPolicy[action.id] === true;

                                                        // Styles based on action type
                                                        let gradientClass = 'bg-gradient-to-r from-indigo-500 to-purple-600';
                                                        let shadowClass = 'shadow-lg shadow-indigo-500/30';
                                                        let textColorClass = 'text-indigo-600';
                                                        let icon = null;

                                                        switch (action.id) {
                                                            case 'create':
                                                                gradientClass = 'bg-gradient-to-r from-purple-500 to-fuchsia-600';
                                                                shadowClass = 'shadow-lg shadow-purple-500/40';
                                                                textColorClass = 'text-purple-600';
                                                                icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />;
                                                                break;
                                                            case 'read':
                                                                gradientClass = 'bg-gradient-to-r from-blue-500 to-cyan-500';
                                                                shadowClass = 'shadow-lg shadow-blue-500/40';
                                                                textColorClass = 'text-blue-500';
                                                                icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />;
                                                                break;
                                                            case 'update':
                                                                gradientClass = 'bg-gradient-to-r from-amber-400 to-orange-500';
                                                                shadowClass = 'shadow-lg shadow-orange-500/40';
                                                                textColorClass = 'text-orange-500';
                                                                icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />;
                                                                break;
                                                            case 'delete':
                                                                gradientClass = 'bg-gradient-to-r from-red-500 to-rose-600';
                                                                shadowClass = 'shadow-lg shadow-red-500/40';
                                                                textColorClass = 'text-red-500';
                                                                icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
                                                                break;
                                                            case 'sidebar':
                                                                gradientClass = 'bg-gradient-to-r from-emerald-400 to-green-600';
                                                                shadowClass = 'shadow-lg shadow-emerald-500/40';
                                                                textColorClass = 'text-emerald-600';
                                                                icon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h7" />;
                                                                break;
                                                            default: break;
                                                        }

                                                        return (
                                                            <td key={action.id} className="py-4 px-4 text-center align-middle">
                                                                <div className="flex justify-center items-center">
                                                                    <button
                                                                        onClick={() => handlePermissionChange(activeRole, resource.id, action.id)}
                                                                        className={`
                                                                            relative w-14 h-8 rounded-full transition-all duration-300 ease-in-out cursor-pointer
                                                                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white
                                                                            ${isChecked ? gradientClass + ' ' + shadowClass : 'bg-gray-200 hover:bg-gray-300'}
                                                                        `}
                                                                        title={isChecked ? `Enabled` : `Enable ${action.name}`}
                                                                    >
                                                                        {/* The Thumb */}
                                                                        <span
                                                                            className={`
                                                                                absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-sm 
                                                                                transition-all duration-300 ease-spring flex items-center justify-center
                                                                                ${isChecked ? 'translate-x-6' : 'translate-x-0'}
                                                                            `}
                                                                        >
                                                                            {/* The Icon inside the Thumb */}
                                                                            <svg
                                                                                className={`w-3.5 h-3.5 transition-colors duration-300 ${isChecked ? textColorClass : 'text-gray-400'}`}
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                                stroke="currentColor"
                                                                            >
                                                                                {icon}
                                                                            </svg>
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12">
                            <span className="text-4xl mb-4">👈</span>
                            <p>Select a role from the sidebar to configure policies.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PolicyEditorView;
