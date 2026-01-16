// src/components/dashboard/RolesManagementView.jsx
import React, { useState, useEffect } from 'react';
import AssignRoleModal from './AssignRoleModal';

interface RolesManagementViewProps {
    apiBase: string;
    token: string;
    users: any[];
    onRefreshUsers: () => void;
    onRolesChange: () => void;
}

const RolesManagementView: React.FC<RolesManagementViewProps> = ({ apiBase, token, users, onRefreshUsers, onRolesChange }) => {
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleLevel, setNewRoleLevel] = useState<number | "">(0);
    const [assignRoleData, setAssignRoleData] = useState({ email: "", roleName: "" });
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    // System roles that cannot be deleted
    // System roles that cannot be deleted - Only SuperAdmin is a fixed constant now
    const systemRoles = ["SuperAdmin"];

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiBase}/api/Roles`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const res = await response.json();
                const data = res.data || {};
                setRoles(data.roles || []);
            } else {
                setError("Failed to fetch roles");
            }
        } catch (err) {
            setError("Network error while fetching roles");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) {
            setError("Role name is required");
            return;
        }

        try {
            const response = await fetch(`${apiBase}/api/Roles/CreateRole`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    RoleName: newRoleName.trim(),
                    OrderLevel: newRoleLevel === "" ? null : Number(newRoleLevel)
                })
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess(`Role "${newRoleName}" created successfully with Level ${data.data.role.OrderLevel}`);
                setNewRoleName("");
                setNewRoleLevel(0);
                setShowCreateModal(false);
                fetchRoles();
                if (onRolesChange) onRolesChange(); // Notify parent
            } else {
                setError(data.message || "Failed to create role");
            }
        } catch (err) {
            setError("Network error");
        }
    };

    const handleUpdateLevel = async (roleName: string, newLevel: number) => {
        try {
            const response = await fetch(`${apiBase}/api/Roles/UpdateRoleOrder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ RoleName: roleName, OrderLevel: newLevel })
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess(`Updated "${roleName}" to Level ${newLevel}`);
                fetchRoles();
            } else {
                setError(data.message || "Failed to update level");
            }
        } catch (err) {
            setError("Network error");
        }
    };

    const handleDeleteRole = async (roleName: string) => {
        if (systemRoles.includes(roleName)) {
            setError("Cannot delete system roles");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) return;

        try {
            const response = await fetch(`${apiBase}/api/Roles/DeleteRole/${encodeURIComponent(roleName)}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess(`Role "${roleName}" deleted successfully`);
                fetchRoles();
            } else {
                setError(data.message || "Failed to delete role");
            }
        } catch (err) {
            setError("Network error");
        }
    };

    const handleAssignRole = async (emailInput: string, roleInput: string) => {
        const emailToUse = emailInput || assignRoleData.email;
        const roleToUse = roleInput || assignRoleData.roleName;

        if (!emailToUse || !roleToUse) {
            setError("Email and role are required");
            return;
        }

        try {
            const response = await fetch(`${apiBase}/api/Roles/AssignRole`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    Email: emailToUse,
                    RoleName: roleToUse
                })
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess(data.message || "Role assigned successfully");
                setAssignRoleData({ email: "", roleName: "" });
                setShowAssignModal(false);
                setSelectedUser(null);
                if (onRefreshUsers) onRefreshUsers();
            } else {
                setError(data.message || "Failed to assign role");
            }
        } catch (err) {
            setError("Network error");
        }
    };

    const handleRemoveRole = async (email: string, roleName: string) => {
        if (!window.confirm(`Are you sure you want to remove the role "${roleName}" from this user?`)) return;

        try {
            const response = await fetch(`${apiBase}/api/Roles/RemoveRole`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    Email: email,
                    RoleName: roleName
                })
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess(data.message || "Role removed successfully");
                if (onRefreshUsers) onRefreshUsers();
            } else {
                setError(data.message || "Failed to remove role");
            }
        } catch (err) {
            setError("Network error");
        }
    };

    const handleToggleStatus = async (userId: string, isActive: boolean, userName: string) => {
        const action = isActive ? "Deactivate" : "Activate";
        if (!window.confirm(`Are you sure you want to ${action} user "${userName}"?`)) return;

        try {
            const response = await fetch(`${apiBase}/api/SuperAdmin/toggle-status/${userId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess(data.message || `User ${action}d successfully`);
                if (onRefreshUsers) onRefreshUsers();
            } else {
                setError(data.message || `Failed to ${action} user`);
            }
        } catch (err) {
            setError("Network error");
        }
    };

    const openAssignModal = (user: any) => {
        setSelectedUser(user);
        setAssignRoleData({ email: user.Email || user.email, roleName: "" });
        setShowAssignModal(true);
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading roles...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions Management</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Create New Role
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700">{error}</p>
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700">{success}</p>
                </div>
            )}

            {/* Roles List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">All Roles ({roles.length})</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roles.map((role) => {
                            const roleName = role.name || role.Name || (typeof role === 'string' ? role : 'Unknown Role');
                            const orderLevel = role.orderLevel ?? role.OrderLevel ?? 0;
                            const isSystemRole = systemRoles.includes(roleName);
                            return (
                                <div
                                    key={roleName}
                                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-gray-900">{roleName}</h4>
                                            {!isSystemRole && (
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200" title="Hierarchy Level">
                                                    Level {orderLevel}
                                                </span>
                                            )}
                                        </div>
                                        {isSystemRole && (
                                            <span className="text-xs text-blue-600">System Role</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isSystemRole && (
                                            <button
                                                onClick={() => handleDeleteRole(roleName)}
                                                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Users with Roles */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Assign Roles to Users</h3>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Roles</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((user: any) => {
                                const userRoles = user.Roles || user.roles || [];
                                // Fix: Handle case sensitivity issues from API (IsActive vs isActive)
                                // Fix: Handle case sensitivity issues from API (IsActive vs isActive)
                                console.log('Current User Object:', JSON.stringify(user));
                                const isActive = user.isActive !== undefined ? user.isActive : user.IsActive;

                                return (
                                    <tr key={user.Id || user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm">{user.Name || user.UserName || user.name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm">{user.Email || user.email || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {userRoles.length === 0 ? (
                                                    <span className="text-xs text-gray-500">No roles</span>
                                                ) : (
                                                    userRoles.map((role: string, idx: number) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                                                        >
                                                            {role}
                                                            <button
                                                                onClick={() => handleRemoveRole(user.Email || user.email, role)}
                                                                className="hover:text-red-700"
                                                                title="Remove role"
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${isActive
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                                {isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex gap-2">
                                            <button
                                                onClick={() => openAssignModal(user)}
                                                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                                            >
                                                Assign Role
                                            </button>
                                            {!(userRoles.includes("SuperAdmin") || userRoles.includes("superadmin")) && (
                                                <button
                                                    onClick={() => handleToggleStatus(user.Id || user.id, isActive, user.Name || user.UserName)}
                                                    className={`
                                                        px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 border
                                                        ${isActive
                                                            ? 'bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm'
                                                            : 'bg-green-600 text-white border-transparent hover:bg-green-700 shadow-sm hover:shadow'
                                                        }
                                                    `}
                                                >
                                                    {isActive ? (
                                                        <>
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                                                            Deactivate
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                            Activate
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Role Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop with blur */}
                        <div
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowCreateModal(false)}
                        />

                        {/* Modal Content */}
                        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8 transform transition-all animate-in fade-in zoom-in-95 duration-200">
                            <div className="absolute top-4 right-4">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">Create New Role</h3>
                                <p className="text-gray-500 text-sm mt-1">Define a new role and its hierarchy level.</p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Role Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="e.g., Regional Manager"
                                            value={newRoleName}
                                            onChange={(e) => setNewRoleName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none font-medium"
                                            autoFocus
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') handleCreateRole();
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Hierarchy Level</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="number"
                                            placeholder="e.g., 10"
                                            value={newRoleLevel}
                                            onChange={(e) => setNewRoleLevel(e.target.value === "" ? "" : parseInt(e.target.value))}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all outline-none font-medium"
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Higher levels (e.g. 50) have more authority than lower levels (e.g. 10).
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewRoleName("");
                                    }}
                                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateRole}
                                    disabled={!newRoleName.trim()}
                                    className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Role
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Assign Role Modal */}
            <AssignRoleModal
                show={showAssignModal}
                user={selectedUser}
                roles={roles}
                onClose={() => {
                    setShowAssignModal(false);
                    setAssignRoleData({ email: "", roleName: "" });
                    setSelectedUser(null);
                }}
                onAssign={handleAssignRole}
            />
        </div >
    );
};

export default RolesManagementView;

