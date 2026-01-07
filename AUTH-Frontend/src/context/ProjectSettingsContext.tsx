import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface ProjectSettings {
    applicationName: string;
    logoUrl: string | null;
}

interface ProjectSettingsContextValue {
    settings: ProjectSettings;
    refreshSettings: () => Promise<void>;
    loading: boolean;
}

const ProjectSettingsContext = createContext<ProjectSettingsContextValue | undefined>(undefined);

export const useProjectSettings = () => {
    const context = useContext(ProjectSettingsContext);
    if (!context) {
        throw new Error('useProjectSettings must be used within a ProjectSettingsProvider');
    }
    return context;
};

export const ProjectSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { apiBase } = useAuth();
    const [settings, setSettings] = useState<ProjectSettings>({
        applicationName: 'Identity System',
        logoUrl: null,
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${apiBase}/api/ProjectSettings`);
            if (response.ok) {
                const res = await response.json();
                if (res.success && res.data) {
                    setSettings({
                        applicationName: res.data.applicationName,
                        logoUrl: res.data.logoUrl,
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch project settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [apiBase]);

    const value: ProjectSettingsContextValue = {
        settings,
        refreshSettings: fetchSettings,
        loading,
    };

    return (
        <ProjectSettingsContext.Provider value={value}>
            {children}
        </ProjectSettingsContext.Provider>
    );
};
