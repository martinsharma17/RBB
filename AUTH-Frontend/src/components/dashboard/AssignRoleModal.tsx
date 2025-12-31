// src/components/dashboard/AssignRoleModal.jsx
import React, { useState, useEffect } from 'react';

interface AssignRoleModalProps {
    show: boolean;
    user: any;
    roles: any[];
    onClose: () => void;
    onAssign: (email: string, role: string) => void;
}

const AssignRoleModal: React.FC<AssignRoleModalProps> = ({
    show,
    user,
    roles,
    onClose,
    onAssign
}) => {
    const [selectedRole, setSelectedRole] = useState("");

    // Reset state when modal opens
    useEffect(() => {
        if (show) {
            setSelectedRole("");
        }
    }, [show]);

    if (!show || !user) return null;

    const userRoles = user.Roles || user.roles || [];

    const handleAssign = () => {
        if (!selectedRole) return;
        onAssign(user.Email || user.email, selectedRole);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Assign Role to User</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                        <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-800">
                            {user.Name || user.UserName || user.name} <span className="text-gray-500 text-sm">({user.Email || user.email})</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Roles</label>
                        <div className="flex flex-wrap gap-2">
                            {userRoles.length > 0 ? (
                                userRoles.map((role: string, idx: number) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                        {role}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500 text-sm italic">No roles assigned</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Role to Assign</label>
                        <select
                            value={selectedRole}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="">-- Select a role --</option>
                            {roles.map((role) => {
                                const roleName = role.Name || role.name || role;
                                const hasRole = userRoles.includes(roleName);
                                return (
                                    <option
                                        key={role.Id || role.id || roleName}
                                        value={roleName}
                                        disabled={hasRole}
                                    >
                                        {roleName} {hasRole ? '(Already Assigned)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedRole}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Assign Role
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignRoleModal;
