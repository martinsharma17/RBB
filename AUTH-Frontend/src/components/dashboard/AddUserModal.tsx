import React, { useEffect, useState } from 'react';
import { branchService, Branch } from '../../services/branchService';
import { useAuth } from '../../context/AuthContext';

interface AddUserModalProps {
    show: boolean;
    newUser: any;
    setNewUser: (user: any) => void;
    onClose: () => void;
    onSubmit: () => void;
    allowRoleSelection?: boolean;
    roles?: any[];
}

const AddUserModal: React.FC<AddUserModalProps> = ({
    show,
    newUser,
    setNewUser,
    onClose,
    onSubmit,
    allowRoleSelection = true,
    roles = []
}) => {
    const { apiBase, token } = useAuth();
    const [branches, setBranches] = useState<Branch[]>([]);

    useEffect(() => {
        if (show && token) {
            loadBranches();
        }
    }, [show, token]);

    const loadBranches = async () => {
        if (!token) return;
        try {
            const data = await branchService.getAll(apiBase, token);
            setBranches(data || []);
        } catch (error) {
            console.error("Failed to load branches", error);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Add New {allowRoleSelection ? 'User / Admin' : 'User'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            placeholder="e.g. John Doe"
                            value={newUser?.name || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="e.g. john@example.com"
                            value={newUser?.email || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="Min 6 characters"
                            value={newUser?.password || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {allowRoleSelection && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
                            <select
                                value={newUser?.role || ''}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewUser({ ...newUser, role: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            >
                                <option value="" disabled>Select a role</option>
                                {roles && roles.length > 0 ? (
                                    roles.map((role, idx) => {
                                        const roleName = typeof role === 'string' ? role : (role.Name || role.name || '');
                                        const roleId = typeof role === 'string' ? role : (role.Id || role.id || idx);
                                        if (!roleName) return null;
                                        return (
                                            <option key={roleId} value={roleName}>
                                                {roleName}
                                            </option>
                                        );
                                    })
                                ) : (
                                    <option value="User">User</option>
                                )}
                            </select>
                        </div>
                    )}

                    {/* Branch Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Branch (Optional)</label>
                        <select
                            value={newUser?.branchId || ""}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewUser({ ...newUser, branchId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                            <option value="">-- No Branch (Head Office) --</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id.toString()}>
                                    {branch.name} ({branch.code})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Add User
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddUserModal;




