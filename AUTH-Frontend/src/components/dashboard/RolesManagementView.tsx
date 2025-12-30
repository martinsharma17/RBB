// src/components/dashboard/RolesManagementView.jsx
import React, { useState, useEffect } from 'react';
import AssignRoleModal from './AssignRoleModal';

const RolesManagementView = ({ apiBase, token, users, onRefreshUsers, onRolesChange }) => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [assignRoleData, setAssignRoleData] = useState({ email: "", roleName: "" });
    const [selectedUser, setSelectedUser] = useState(null);

    // System roles that cannot be deleted
    const systemRoles = ["SuperAdmin", "Admin", "User"];

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
                const data = await response.json();
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
                body: JSON.stringify({ RoleName: newRoleName.trim() })
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess(`Role "${newRoleName}" created successfully`);
                setNewRoleName("");
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

    const handleDeleteRole = async (roleName) => {
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

    const handleAssignRole = async (emailInput, roleInput) => {
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

    const handleRemoveRole = async (email, roleName) => {
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

    const handleToggleStatus = async (userId, isActive, userName) => {
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

    const openAssignModal = (user) => {
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
                        {roles.map((role, index) => {
                            const roleName = role.Name || role.name || (typeof role === 'string' ? role : 'Unknown Role');
                            const roleId = role.Id || role.id || index;
                            const isSystemRole = systemRoles.includes(roleName);
                            return (
                                <div
                                    key={roleId}
                                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                                >
                                    <div>
                                        <h4 className="font-medium text-gray-900">{roleName}</h4>
                                        {isSystemRole && (
                                            <span className="text-xs text-blue-600 mt-1">System Role</span>
                                        )}
                                    </div>
                                    {!isSystemRole && (
                                        <button
                                            onClick={() => handleDeleteRole(roleName)}
                                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        >
                                            Delete
                                        </button>
                                    )}
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
                            {users.map((user) => {
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
                                                    userRoles.map((role, idx) => (
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">Create New Role</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Manager, Editor, Viewer"
                                        value={newRoleName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRoleName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') handleCreateRole();
                                        }}
                                    />
                                </div>
                                <div className="text-sm text-gray-500">
                                    <p>Note: System roles (SuperAdmin, Admin, User) cannot be deleted.</p>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewRoleName("");
                                    }}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateRole}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

