// src/components/dashboard/AddUserModal.jsx

const AddUserModal = ({
    show,
    newUser,
    setNewUser,
    onClose,
    onSubmit,
    allowRoleSelection = true,
    roles = [] // Default to empty array
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Add New {allowRoleSelection ? 'User/Admin' : 'User'}</h3>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Name"
                        value={newUser.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={newUser.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={newUser.password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    {allowRoleSelection && (
                        <select
                            value={newUser.role}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUser({ ...newUser, role: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                            {/* Default option if roles empty or to prompt selection, but keeping simple defaults for now */}
                            {roles && roles.length > 0 ? (
                                roles.map((role) => {
                                    const roleName = role.Name || role.name || role;
                                    return (
                                        <option key={role.Id || role.id || roleName} value={roleName}>
                                            {roleName}
                                        </option>
                                    );
                                })
                            ) : (
                                <>
                                    <option value="User">User</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Manager">Manager</option>
                                </>
                            )}
                        </select>
                    )}
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddUserModal;

