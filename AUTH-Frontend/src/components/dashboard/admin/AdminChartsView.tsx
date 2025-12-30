// src/components/dashboard/admin/AdminChartsView.jsx
import React from 'react';

const AdminChartsView = ({ totalUsers }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Statistics & Charts</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Assigned Users</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{totalUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{totalUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Total Managed</h3>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{totalUsers}</p>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">User Activity</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-600">Active Users</span>
                            <span className="text-sm font-medium">{totalUsers}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-6">
                            <div
                                className="bg-blue-600 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                style={{ width: totalUsers > 0 ? '100%' : '0%' }}
                            >
                                {totalUsers > 0 && '100%'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminChartsView;

