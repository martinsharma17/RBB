// src/components/dashboard/ChartsView.jsx
import React from 'react';

const ChartsView = ({ regularUsers, totalAdmins, totalAccounts }) => {
    const userPercentage = totalAccounts > 0 ? (regularUsers / totalAccounts) * 100 : 0;
    const adminPercentage = totalAccounts > 0 ? (totalAdmins / totalAccounts) * 100 : 0;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Statistics & Charts</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{regularUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Total Admins</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{totalAdmins}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Total Accounts</h3>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{totalAccounts}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Active Sessions</h3>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{totalAccounts}</p>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">User Distribution</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-600">Regular Users</span>
                            <span className="text-sm font-medium">{regularUsers} ({userPercentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-6">
                            <div 
                                className="bg-blue-600 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                style={{ width: `${userPercentage}%` }}
                            >
                                {userPercentage > 10 && `${userPercentage.toFixed(1)}%`}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-600">Admins</span>
                            <span className="text-sm font-medium">{totalAdmins} ({adminPercentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-6">
                            <div 
                                className="bg-green-600 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                style={{ width: `${adminPercentage}%` }}
                            >
                                {adminPercentage > 10 && `${adminPercentage.toFixed(1)}%`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pie Chart Representation */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Account Type Distribution</h3>
                <div className="flex items-center justify-center">
                    <div className="relative w-64 h-64">
                        <svg className="transform -rotate-90" width="256" height="256">
                            <circle
                                cx="128"
                                cy="128"
                                r="100"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="40"
                            />
                            <circle
                                cx="128"
                                cy="128"
                                r="100"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="40"
                                strokeDasharray={`${2 * Math.PI * 100 * (userPercentage / 100)} ${2 * Math.PI * 100}`}
                                strokeDashoffset="0"
                            />
                            <circle
                                cx="128"
                                cy="128"
                                r="100"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="40"
                                strokeDasharray={`${2 * Math.PI * 100 * (adminPercentage / 100)} ${2 * Math.PI * 100}`}
                                strokeDashoffset={`-${2 * Math.PI * 100 * (userPercentage / 100)}`}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{totalAccounts}</div>
                                <div className="text-sm text-gray-500">Total</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-600 rounded"></div>
                        <span className="text-sm">Users ({regularUsers})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-600 rounded"></div>
                        <span className="text-sm">Admins ({totalAdmins})</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartsView;

