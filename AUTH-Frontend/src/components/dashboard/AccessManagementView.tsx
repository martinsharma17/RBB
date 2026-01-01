import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminUser {
    Id?: string;
    id?: string;
    Name?: string;
    name?: string;
    UserName?: string;
    Email?: string;
    email?: string;
}

interface AccessManagementViewProps {
    admins: AdminUser[];
    onAddUser: () => void;
    onRevokeAdmin: (id: string) => void;
}

const AccessManagementView: React.FC<AccessManagementViewProps> = ({ admins, onAddUser, onRevokeAdmin }) => {
    useAuth();
    const navigate = useNavigate();

    // Note: token, apiBase, and navigate are available if needed for future enhancements
    // such as direct API calls from this view.

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Admin Access Management</h2>
                <button
                    onClick={onAddUser}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Grant Admin Access
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800">Admin Permissions</h3>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 mb-6">
                        Manage which admins have access to specific features and user lists.
                    </p>
                    <div className="space-y-4">
                        {admins.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                                <p className="text-gray-500">No admins found</p>
                            </div>
                        ) : (
                            admins.map((admin) => (
                                <div key={admin.Id || admin.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{admin.Name || admin.UserName || admin.name}</h4>
                                            <p className="text-sm text-gray-500">{admin.Email || admin.email}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onRevokeAdmin((admin.Id || admin.id) ?? '')}
                                                className="px-4 py-2 text-sm font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                                            >
                                                Revoke Access
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessManagementView;
