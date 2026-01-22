import React from 'react';
import SidebarUserContext from './SidebarUserContext'; // [NEW]
import { SidebarItem as SidebarItemType, Permissions } from '../../types';
import { useProjectSettings } from '../../context/ProjectSettingsContext';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    activeView: string;
    setActiveView: (view: string) => void;
    menuItems: SidebarItemType[];
    onLogout: () => void;
    user: any;
    permissions: Permissions | null;
}

const Sidebar: React.FC<SidebarProps> = ({
    sidebarOpen,
    setSidebarOpen,
    activeView,
    setActiveView,
    menuItems,
    onLogout,
    user,
    permissions
}) => {
    const [expandedMenus, setExpandedMenus] = React.useState<Record<string, boolean>>({});
    const { settings } = useProjectSettings();

    const toggleMenu = (menuId: string) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuId]: !prev[menuId]
        }));
    };

    return (
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-700 flex items-center gap-3">
                <div className="flex-shrink-0">
                    {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded" />
                    ) : (
                        <div className="w-8 h-8 bg-primary-blue rounded flex items-center justify-center font-bold">
                            {settings.applicationName.charAt(0)}
                        </div>
                    )}
                </div>
                {sidebarOpen && (
                    <h2 className="text-xl font-bold truncate">
                        {(() => {
                            const roles = user?.roles || [];
                            if (roles.includes("SuperAdmin")) return "SuperAdmin";
                            return "Management"; // Generic for all dynamic staff roles
                        })()} Dashboard
                    </h2>
                )}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="ml-auto text-gray-400 hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sidebarOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <SidebarItem
                        key={item.id}
                        item={item}
                        depth={0}
                        activeView={activeView}
                        setActiveView={setActiveView}
                        sidebarOpen={sidebarOpen}
                        setSidebarOpen={setSidebarOpen}
                        expandedMenus={expandedMenus}
                        toggleMenu={toggleMenu}
                        permissions={permissions} // [NEW] Pass permissions
                    />
                ))}
            </nav>

            {/* User Context Card (Extracted Component) */}
            <SidebarUserContext
                user={user}
                permissions={permissions}
                sidebarOpen={sidebarOpen}
            />

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-700">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {sidebarOpen && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
};

// Recursive Sidebar Item Component
interface SidebarItemProps {
    item: any;
    depth: number;
    activeView: string;
    setActiveView: (view: string) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    expandedMenus: Record<string, boolean>;
    toggleMenu: (menuId: string) => void;
    permissions: Permissions | null;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
    item,
    depth,
    activeView,
    setActiveView,
    sidebarOpen,
    setSidebarOpen,
    expandedMenus,
    toggleMenu,
    permissions
}) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.id];

    // Check if this item OR any of its descendants are active
    const isActive = activeView === item.id;

    // Calculate indentation based on depth
    const paddingLeft = depth === 0 ? '1rem' : `${depth * 1.5 + 1}rem`;

    return (
        <div>
            <button
                onClick={() => {
                    if (hasChildren) {
                        toggleMenu(item.id);
                        if (!sidebarOpen) setSidebarOpen(true);
                    } else {
                        // FIX: If item.id is 'dashboard', use 'home' to avoid double /dashboard/dashboard URL
                        const targetView = item.id === 'dashboard' ? 'home' : item.id;
                        setActiveView(targetView);
                    }
                }}
                disabled={item.disabled}
                className={`w-full flex items-center justify-between py-2 rounded-lg transition-colors ${isActive
                    ? "bg-primary-blue text-white"
                    : item.disabled
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-gray-300 hover:bg-gray-800"
                    }`}
                style={{ paddingLeft, paddingRight: '1rem' }}
                title={item.url ? `${item.label} (${item.url})` : item.label} // Show URL in tooltip if available
            >
                <div className="flex items-center gap-3">
                    {/* Only show icon for top-level items to keep it clean, or use dot for children */}
                    {depth === 0 && Icon && <Icon className="w-5 h-5 flex-shrink-0" />}

                    {/* If we strictly want icons for all, we can fallback to a dot */}
                    {depth > 0 && (
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-gray-500'}`}></div>
                    )}

                    {sidebarOpen && <span className="text-sm truncate">{item.label}</span>}
                </div>


                {hasChildren && sidebarOpen && (
                    <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>

            {/* Recursive Children Rendering */}
            {hasChildren && sidebarOpen && isExpanded && (
                <div className="space-y-1">
                    {item.children.map((child: any) => (
                        <SidebarItem
                            key={child.id}
                            item={child}
                            depth={depth + 1}
                            activeView={activeView}
                            setActiveView={setActiveView}
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                            expandedMenus={expandedMenus}
                            toggleMenu={toggleMenu}
                            permissions={permissions}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


export default Sidebar;

