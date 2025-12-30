// src/components/dashboard/admin/AdminResourceView.jsx
import React, { useState } from 'react';

/**
 * AdminResourceView
 * A generic component to manage resources (Tasks, Projects) 
 * strictly enforcing permissions passed via props.
 */
const AdminResourceView = ({
    resourceName,
    canCreate,
    canUpdate,
    canDelete
}) => {
    // Mock Data
    const [items, setItems] = useState([
        { id: 1, title: `Sample ${resourceName} 1`, status: 'Active', updated: '2 mins ago' },
        { id: 2, title: `Sample ${resourceName} 2`, status: 'Pending', updated: '1 hour ago' },
        { id: 3, title: `Sample ${resourceName} 3`, status: 'Completed', updated: '1 day ago' },
    ]);

    const handleDelete = (id) => {
        if (!canDelete) return;
        if (window.confirm(`Are you sure you want to delete this ${resourceName}?`)) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleCreate = () => {
        if (!canCreate) return;
        const newId = Math.max(...items.map(i => i.id), 0) + 1;
        setItems([...items, {
            id: newId,
            title: `New ${resourceName} ${newId}`,
            status: 'New',
            updated: 'Just now'
        }]);
    };

    const handleUpdate = (id) => {
        if (!canUpdate) return;
        alert(`Edit ${resourceName} ${id} (Functionality would open modal)`);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{resourceName} Management</h2>
                    <p className="text-gray-600 text-sm mt-1">Manage system {resourceName.toLowerCase()}</p>
                </div>

                {/* Create Action - Policy Enforced with Error Feedback */}
                <button
                    onClick={canCreate ? handleCreate : () => alert("Access Denied: You do not have permission to create this resource. Contact your administrator.")}
                    className={`px-4 py-2 rounded-lg shadow-sm transition-colors ${canCreate
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    title={canCreate ? "Create New" : "Access Denied"}
                >
                    Add New {resourceName}
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">All {resourceName}s ({items.length})</h3>
                    {!canDelete && !canUpdate && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                            Read Only View
                        </span>
                    )}
                </div>

                <ul className="divide-y divide-gray-200">
                    {items.map(item => (
                        <li key={item.id} className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center transition-colors">
                            <div>
                                <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${item.status === 'Active' ? 'bg-green-100 text-green-700' :
                                        item.status === 'Completed' ? 'bg-gray-100 text-gray-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {item.status}
                                    </span>
                                    <span className="text-xs text-gray-500">Updated {item.updated}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Update Action - Policy Enforced */}
                                {canUpdate && (
                                    <button
                                        onClick={() => handleUpdate(item.id)}
                                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                        title="Edit"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                    </button>
                                )}

                                {/* Delete Action - Policy Enforced */}
                                {canDelete && (
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Delete"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AdminResourceView;
