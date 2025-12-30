// src/components/dashboard/admin/AdminDashboardView.jsx
import React from 'react';

const AdminDashboardView = ({ totalUsers, onViewUsers, onViewCharts, onAddUser }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
                <p className="text-gray-600 mt-2">Manage user accounts assigned to you</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Assigned Users</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{totalUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{totalUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Total Managed</h3>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{totalUsers}</p>
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

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You can only manage users that have been assigned to you by the SuperAdmin. 
                    Contact SuperAdmin if you need access to additional users.
                </p>
            </div>
        </div>
    );
};

export default AdminDashboardView;

