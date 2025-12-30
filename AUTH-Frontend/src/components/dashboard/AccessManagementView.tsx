// src/components/dashboard/AccessManagementView.jsx

const AccessManagementView = ({ admins, onAddUser, onRevokeAdmin }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Admin Access Management</h2>
                <button
                    onClick={onAddUser}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Grant Admin Access
                </button>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Admin Permissions</h3>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 mb-4">
                        Manage which admins have access to specific features and user lists.
                    </p>
                    <div className="space-y-4">
                        {admins.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No admins found</p>
                        ) : (
                            admins.map((admin) => (
                                <div key={admin.Id || admin.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{admin.Name || admin.UserName || admin.name}</h4>
                                            <p className="text-sm text-gray-500">{admin.Email || admin.email}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onRevokeAdmin(admin.Id || admin.id)}
                                                className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
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

