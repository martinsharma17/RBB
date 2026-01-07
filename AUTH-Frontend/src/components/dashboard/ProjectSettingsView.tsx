import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';

const ProjectSettingsView = () => {
    const { token, apiBase } = useAuth();
    const { settings, refreshSettings } = useProjectSettings();
    const [name, setName] = useState(settings.applicationName);
    const [logo, setLogo] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(settings.logoUrl);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        setName(settings.applicationName);
        setPreview(settings.logoUrl);
    }, [settings]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogo(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('applicationName', name);
        if (logo) {
            formData.append('logo', logo);
        }

        try {
            const response = await fetch(`${apiBase}/api/ProjectSettings/update`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const res = await response.json();
            if (res.success) {
                setMessage({ type: 'success', text: 'Settings updated successfully!' });
                await refreshSettings();
            } else {
                setMessage({ type: 'error', text: res.message || 'Failed to update settings.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Global Project Settings</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Application Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="e.g. Identity System"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Application Logo
                    </label>
                    <div className="mt-1 flex items-center gap-4">
                        <div className="h-20 w-20 border rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                            {preview ? (
                                <img src={preview} alt="Logo Preview" className="h-full w-full object-contain" />
                            ) : (
                                <span className="text-gray-400 text-xs">No Logo</span>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 italic">
                        Recommended: Square image (256x256), PNG or SVG format.
                    </p>
                </div>

                {message && (
                    <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-2 rounded-md text-white font-medium transition-all ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-95'}`}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    SuperAdmin Only
                </h3>
                <p className="text-xs text-blue-600 leading-relaxed">
                    Changes made here will reflect globally across the Sidebar, Navbar, and all user dashboards immediately after saving.
                </p>
            </div>
        </div>
    );
};

export default ProjectSettingsView;
