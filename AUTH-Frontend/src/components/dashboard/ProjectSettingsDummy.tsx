import React, { useState } from 'react';

const ProjectSettingsDummy = () => {
    // Dummy Data
    const [settings, setSettings] = useState([
        { id: 1, key: 'Project Name', value: 'Project Alpha' },
        { id: 2, key: 'Max Users', value: '50' },
        { id: 3, key: 'Status', value: 'Active' },
    ]);

    const [isEditing, setIsEditing] = useState(false);
    const [currentSetting, setCurrentSetting] = useState({ id: null, key: '', value: '' });

    // CREATE / UPDATE
    const handleSave = () => {
        if (!currentSetting.key || !currentSetting.value) return;

        if (currentSetting.id) {
            // Update
            setSettings(settings.map(s => s.id === currentSetting.id ? currentSetting : s));
        } else {
            // Create
            setSettings([...settings, { ...currentSetting, id: Date.now() }]);
        }
        setIsEditing(false);
        setCurrentSetting({ id: null, key: '', value: '' });
    };

    // DELETE
    const handleDelete = (id) => {
        if (window.confirm("Are you sure?")) {
            setSettings(settings.filter(s => s.id !== id));
        }
    };

    // EDIT
    const handleEdit = (setting) => {
        setCurrentSetting(setting);
        setIsEditing(true);
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Project Settings (Dummy CRUD)</h2>

            {/* Form */}
            <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-3">{currentSetting.id ? 'Edit Setting' : 'Add New Setting'}</h3>
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Setting Key"
                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={currentSetting.key}
                        onChange={(e) => setCurrentSetting({ ...currentSetting, key: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Value"
                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={currentSetting.value}
                        onChange={(e) => setCurrentSetting({ ...currentSetting, value: e.target.value })}
                    />
                    <button
                        onClick={handleSave}
                        className={`px-4 py-2 rounded text-white font-medium ${currentSetting.id ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {currentSetting.id ? 'Update' : 'Add'}
                    </button>
                    {isEditing && (
                        <button
                            onClick={() => { setIsEditing(false); setCurrentSetting({ id: null, key: '', value: '' }); }}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setting Key</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {settings.length > 0 ? (
                            settings.map((setting) => (
                                <tr key={setting.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{setting.key}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{setting.value}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(setting)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        {(setting.key !== 'Project Name') && ( // Protect one item for fun
                                            <button
                                                onClick={() => handleDelete(setting.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No settings found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectSettingsDummy;
