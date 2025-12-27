// src/components/dashboard/DashboardView.jsx
import React from 'react';

const DashboardView = ({ 
    regularUsers, 
    totalAdmins, 
    totalAccounts, 
    loginTime, 
    onViewUsers, 
    onViewAdmins, 
    onViewCharts, 
    onAddUser 
}) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h2>
                <p className="text-gray-600 mt-2">Manage all users and administrators</p>
                {loginTime && (
                    <p className="text-sm mt-1 text-gray-500">Last login: {loginTime}</p>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{regularUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Total Admins</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{totalAdmins}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Total Accounts</h3>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{totalAccounts}</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={onViewUsers}
                        className="px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        View Users
                    </button>
                    <button
                        onClick={onViewAdmins}
                        className="px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                        View Admins
                    </button>
                    <button
                        onClick={onViewCharts}
                        className="px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                        View Charts
                    </button>
                    <button
                        onClick={onAddUser}
                        className="px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                        Add User
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;

