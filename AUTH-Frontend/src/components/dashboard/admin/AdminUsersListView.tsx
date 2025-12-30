// src/components/dashboard/admin/AdminUsersListView.jsx

const AdminUsersListView = ({ users, onDelete, canEdit, onAssignRole, onAddUser, roles = [], filterRole }) => {
    const [activeTab, setActiveTab] = React.useState(filterRole || 'All');

    // Get unique roles for tabs - combining default roles with any roles found in user list
    const availableRoles = [
        'All',
        ...roles.map(r => r.Name || r.name || r).filter(Boolean)
    ];

    const filteredUsers = users.filter((u) => {
        if (activeTab === 'All') return true;
        const uRoles = u.roles || u.Roles || [];
        return uRoles.includes(activeTab);
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage system users, their roles, and status.</p>
                </div>
                {onAddUser && (
                    <button
                        onClick={onAddUser}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add New User
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
                {availableRoles.map(role => (
                    <button
                        key={role}
                        onClick={() => setActiveTab(role)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === role
                                ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                    >
                        {role}{role !== 'All' ? 's' : ''}
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === role ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {users.filter(u => {
                                if (role === 'All') return true;
                                const uRoles = u.roles || u.Roles || [];
                                return uRoles.includes(role);
                            }).length}
                        </span>
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">Users ({filteredUsers.length})</h3>
                        <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                            Admin Access Only
                        </span>
                    </div>
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
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        No users matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id || user.Id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm">{user.name || user.Name || user.UserName || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm">{user.email || user.Email || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                                {user.roles?.join(', ') || user.Roles?.join(', ') || 'User'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                {/* Edit Action - Enforced by Policy */}
                                                {canEdit && (
                                                    <button
                                                        onClick={() => alert("Edit User functionality would open here")}
                                                        className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                                                    >
                                                        Edit
                                                    </button>
                                                )}

                                                {/* Assign Role Action */}
                                                {onAssignRole && (
                                                    <button
                                                        onClick={() => onAssignRole(user)}
                                                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                                                    >
                                                        Role
                                                    </button>
                                                )}

                                                {/* Delete Action - Already enforced by parent passing null/undefined if disabled */}
                                                {onDelete && (
                                                    <button
                                                        onClick={() => onDelete(user.id || user.Id)}
                                                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsersListView;

