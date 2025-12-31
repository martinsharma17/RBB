import React from 'react';
import { User, Permissions } from '../../types';

interface SidebarUserContextProps {
    user: User | null;
    permissions: Permissions | null;
    sidebarOpen: boolean;
}

const SidebarUserContext: React.FC<SidebarUserContextProps> = ({ sidebarOpen }) => {
    if (!sidebarOpen) return null;

    return (
        <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
            {/* <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                My Access
            </div>
            <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-300">
                    <span>Roles:</span>
                    <span className="font-mono bg-gray-700 px-2 rounded text-white">{rolesCount}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                    <span>Permissions:</span>
                    <span className="font-mono bg-gray-700 px-2 rounded text-white">{permissionsCount}</span>
                </div>
            </div> */}
        </div>
    );
};

export default SidebarUserContext;
