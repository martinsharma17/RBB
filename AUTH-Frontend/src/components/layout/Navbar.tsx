

// src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

interface IconProps {
    className?: string;
}

const HomeIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const DashboardIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const UserIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LogoutIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const ShieldIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Safe function to get user initial
    const getUserInitial = () => {
        if (!user) return 'U';

        // Check name first
        if (user.name && typeof user.name === 'string' && user.name.trim()) {
            return user.name.charAt(0).toUpperCase();
        }

        // Check email
        if (user.email && typeof user.email === 'string' && user.email.trim()) {
            return user.email.charAt(0).toUpperCase();
        }

        // Fallback
        return 'U';
    };

    // Safe function to get display name
    const getDisplayName = () => {
        if (!user) return '';

        if (user.name && typeof user.name === 'string' && user.name.trim()) {
            return user.name;
        }

        if (user.email && typeof user.email === 'string') {
            return user.email.split('@')[0];
        }

        return 'User';
    };

    // Safe function to get user email
    const getUserEmail = () => {
        if (!user) return '';
        return user.email || '';
    };

    // Safe function to get user roles - Returns only the highest role for display
    const getUserRoles = () => {
        if (!user || !user.roles) return ['User'];
        const roles = Array.isArray(user.roles) ? user.roles : ['User'];

        if (roles.includes('SuperAdmin')) return ['SuperAdmin'];
        if (roles.includes('Admin')) return ['Admin'];

        return roles.length > 0 ? roles : ['User'];
    };

    if (!user) {
        return (
            <nav className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo */}
                        <Link
                            to="/"
                            className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors duration-200"
                        >
                            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-lg">A</span>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                                AuthApp
                            </span>
                        </Link>

                        {/* Login buttons when not authenticated */}
                        <div className="flex items-center space-x-3">
                            <Link
                                to="/login"
                                className="px-4 py-2 text-sm font-medium text-white hover:text-gray-200 transition-colors duration-200"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="px-4 py-2 text-sm font-medium bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-sm"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left side - Logo and Navigation */}
                    <div className="flex items-center space-x-4">
                        {/* Logo */}
                        <Link
                            to="/"
                            className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors duration-200"
                        >
                            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-lg">A</span>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                                AuthApp
                            </span>
                        </Link>

                        {/* Navigation Links - Only show when logged in */}
                        <div className="hidden md:flex items-center space-x-1">


                            {/* Navigation Links - Only show when logged in */}
                            {user && (
                                <div className="hidden md:flex items-center space-x-1">
                                    {/* Dashboard link for all users */}
                                    <Link
                                        to="/dashboard"
                                        className="flex items-center space-x-1 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                                    >
                                        <DashboardIcon className="h-4 w-4" />
                                        <span className="text-sm font-medium">Dashboard</span>
                                    </Link>

                                    {/* Home link for all users */}
                                    <Link
                                        to="/"
                                        className="flex items-center space-x-1 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                                    >
                                        <HomeIcon className="h-4 w-4" />
                                        <span className="text-sm font-medium">Home</span>
                                    </Link>

                                    {/* ADMIN PANEL - Only for Admin and SuperAdmin roles */}
                                    {(user.roles?.includes('Admin') || user.roles?.includes('SuperAdmin')) && (
                                        <Link
                                            to="/admin"
                                            className="flex items-center space-x-1 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200 bg-white/5"
                                        >
                                            <ShieldIcon className="h-4 w-4" />
                                            <span className="text-sm font-medium">Admin Panel</span>
                                        </Link>
                                    )}

                                    {/* SUPER ADMIN PANEL - Only for SuperAdmin role */}
                                    {user.roles?.includes('SuperAdmin') && (
                                        <Link
                                            to="/super-admin"
                                            className="flex items-center space-x-1 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200 bg-gradient-to-r from-red-500/10 to-orange-500/10"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-sm font-medium">Super Admin</span>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side - User Profile */}
                    <div className="flex items-center">
                        <div className="relative" ref={profileMenuRef}>
                            {/* Profile Button */}
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 rounded-full px-3 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                            >
                                {/* Avatar - Show Google profile picture if available, else show initial */}
                                {(() => {
                                    console.log('Navbar - User object:', user);
                                    console.log('Navbar - User picture:', user?.picture);
                                    return user?.picture ? (
                                        <img
                                            src={user.picture}
                                            alt={getDisplayName()}
                                            className="h-8 w-8 rounded-full object-cover shadow-md border-2 border-white"
                                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                console.error('Failed to load profile picture:', user.picture);
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                                            {getUserInitial()}
                                        </div>
                                    );
                                })()}
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium text-white">
                                        {getDisplayName()}
                                    </p>
                                    <p className="text-xs text-gray-200">
                                        {getUserRoles()[0] || 'User'}
                                    </p>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in z-50">
                                    {/* Header */}
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <div className="flex items-center space-x-3 mb-2">
                                            {user?.picture ? (
                                                <img
                                                    src={user.picture}
                                                    alt={getDisplayName()}
                                                    className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                                    {getUserInitial()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{getDisplayName()}</p>
                                                <p className="text-xs text-gray-500 truncate">{getUserEmail()}</p>
                                            </div>
                                        </div>
                                        {user?.name && (
                                            <p className="text-xs text-gray-600 mb-2">Name: {user.name}</p>
                                        )}
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {getUserRoles().map((role, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 font-medium"
                                                >
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-1">
                                        <Link
                                            to="/profile"
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
                                            onClick={() => setShowProfileMenu(false)}
                                        >
                                            <UserIcon className="h-4 w-4 mr-3 text-gray-400" />
                                            View Profile
                                        </Link>
                                        <Link
                                            to="/settings"
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
                                            onClick={() => setShowProfileMenu(false)}
                                        >
                                            <svg className="h-4 w-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Settings
                                        </Link>
                                    </div>

                                    {/* Logout Button */}
                                    <div className="border-t border-gray-100 pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
                                        >
                                            <LogoutIcon className="h-4 w-4 mr-3" />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden bg-blue-700/90 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 py-2 flex justify-center space-x-6">
                    {/* Mobile Navigation - Only show when logged in */}
                    {user && (
                        <div className="md:hidden bg-blue-700/90 backdrop-blur-sm">
                            <div className="max-w-7xl mx-auto px-4 py-2 flex justify-center space-x-6">
                                <Link
                                    to="/dashboard"
                                    className="flex items-center space-x-1 px-3 py-1 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                                >
                                    <DashboardIcon className="h-4 w-4" />
                                    <span className="text-sm">Dashboard</span>
                                </Link>
                                <Link
                                    to="/"
                                    className="flex items-center space-x-1 px-3 py-1 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                                >
                                    <HomeIcon className="h-4 w-4" />
                                    <span className="text-sm">Home</span>
                                </Link>

                                {/* ADMIN Panel for mobile */}
                                {(user.roles?.includes('Admin') || user.roles?.includes('SuperAdmin')) && (
                                    <Link
                                        to="/admin"
                                        className="flex items-center space-x-1 px-3 py-1 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                                    >
                                        <ShieldIcon className="h-4 w-4" />
                                        <span className="text-sm">Admin</span>
                                    </Link>
                                )}

                                {/* SUPER ADMIN Panel for mobile */}
                                {user.roles?.includes('SuperAdmin') && (
                                    <Link
                                        to="/super-admin"
                                        className="flex items-center space-x-1 px-3 py-1 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm">Super Admin</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
            `}</style>
        </nav>
    );
};

export default Navbar;