import React from 'react';

interface UsersAdminsListViewProps {
    users: any[];
    admins: any[];
    roles?: any[];
    isAlreadyAdmin: (email: string) => boolean;
    onAddUser: () => void;
    onMakeAdmin: (userId: string) => void;
    onDelete: (userId: string, isAdmin?: boolean) => void;
    onRevokeAdmin: (userId: string) => void;
    onAssignRole: (user: any) => void;
}

const UsersAdminsListView: React.FC<UsersAdminsListViewProps> = ({
    users,
    roles = [],
    onAddUser,
    onDelete,
    onAssignRole
}) => {
    // Helper to get users for a specific role
    const getUsersInRole = (roleName: string) => {
        return users.filter((user: any) => {
            const userRoles = user.Roles || user.roles || [];
            return userRoles.includes(roleName);
        });
    };

    // If roles are not yet loaded, show nothing
    const displayRoles = roles.length > 0 ? roles : [];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Users & Roles Management</h2>
                <button
                    onClick={onAddUser}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Add New User
                </button>
            </div>

            {displayRoles.map((role) => {
                const roleName = role.Name || role.name || role;
                const roleUsers = getUsersInRole(roleName);

                return (
                    <div key={roleName} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">{roleName}s ({roleUsers.length})</h3>
                        </div>
                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {roleUsers.length > 0 ? (
                                        roleUsers.map((user) => {
                                            const userRoles = user.Roles || user.roles || [];
                                            return (
                                                <tr key={user.Id || user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm">{user.Name || user.UserName || user.name || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-sm">{user.Email || user.email || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <div className="flex flex-wrap gap-1">
                                                            {userRoles.map((r: any, i: number) => (
                                                                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                                                    {r}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex space-x-2">
                                                            {(user.Email === 'martinsharma18@gmail.com' || user.email === 'martinsharma18@gmail.com') ? (
                                                                <span className="text-xs text-gray-400 font-medium italic px-2">Protected Account</span>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={() => onAssignRole(user)}
                                                                        className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                                                                    >
                                                                        Manage Roles
                                                                    </button>
                                                                    <button
                                                                        onClick={() => onDelete(user.Id || user.id)}
                                                                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                                    >
                                                                        Delete User
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500 text-sm">
                                                No users in this role
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default UsersAdminsListView;
