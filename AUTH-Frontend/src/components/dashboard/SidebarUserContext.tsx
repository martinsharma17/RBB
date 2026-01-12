import React from 'react';
import { User, Permissions } from '../../types';

interface SidebarUserContextProps {
    user: User | null;
    permissions: Permissions | null;
    sidebarOpen: boolean;
}

const SidebarUserContext: React.FC<SidebarUserContextProps> = ({ user, sidebarOpen }) => {
    if (!sidebarOpen) return null;

    return (
        <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold border-2 border-gray-700">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700/50">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-semibold text-blue-400 uppercase tracking-wider">Branch:</span>
                </div>
                <p className="text-sm text-gray-200 mt-1 font-medium bg-gray-900/50 px-2 py-1 rounded inline-block">
                    {user?.branchName || "Head Office / Global"}
                </p>
            </div>
        </div>
    );
};

export default SidebarUserContext;
