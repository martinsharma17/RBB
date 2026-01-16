import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { toast } from 'react-hot-toast';
import { Save, Upload, RefreshCw } from 'lucide-react';

const ProjectSettingsView = () => {
    const { token, apiBase } = useAuth();
    const { settings, refreshSettings } = useProjectSettings();

    const [appName, setAppName] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setAppName(settings.applicationName || '');
            setLogoPreview(settings.logoUrl);
        }
    }, [settings]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('ApplicationName', appName);
            if (logoFile) {
                formData.append('Logo', logoFile);
            }

            const response = await fetch(`${apiBase}/api/ProjectSettings/update`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                toast.success('Settings updated successfully');
                await refreshSettings();
                // Force a hard reload if needed, or rely on context
                // window.location.reload(); 
            } else {
                toast.error('Failed to update settings');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">System Customization</h1>
                <p className="text-gray-500 mt-1">Manage application branding and basic settings.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSave} className="space-y-8">

                    {/* Logo Section */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-4">Application Logo</label>
                        <div className="flex items-start gap-8">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="text-4xl text-gray-300 font-bold">Logo</div>
                                    )}
                                </div>
                                <label className="absolute inset-0 cursor-pointer bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl flex items-center justify-center">
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    <div className="opacity-0 group-hover:opacity-100 bg-white/90 px-3 py-1 rounded-full shadow-sm text-xs font-bold text-gray-700">
                                        Change
                                    </div>
                                </label>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 mb-4">
                                    Upload a transparent PNG or SVG for best results. Recommended size: 128x128px.
                                </p>
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors font-medium text-sm">
                                    <Upload size={16} />
                                    <span>Upload New Image</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* App Name Section */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Application Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none font-medium text-gray-900"
                                placeholder="e.g. Identity Management System"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded border border-gray-100">
                                Shows in Title
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={refreshSettings}
                            className="px-4 py-2.5 text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-medium flex items-center gap-2 transition-colors"
                        >
                            <RefreshCw size={18} />
                            <span>Reset</span>
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ProjectSettingsView;
