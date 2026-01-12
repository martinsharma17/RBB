import { useAuth } from '../../context/AuthContext';

const SettingsView = () => {
    const { user } = useAuth();

    return (
        <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Account Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Information */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profile details
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                                    <p className="text-gray-900 font-medium">{user?.name || 'Not set'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                                    <p className="text-gray-900 font-medium">{user?.email}</p>
                                </div>
                                <div className="pt-2 border-t border-gray-200">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assigned Branch</label>
                                    <div className="mt-1">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {user?.branchName || "Head Office / Global"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Roles & Access
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="flex flex-wrap gap-2">
                                {user?.roles?.map((role) => (
                                    <span key={role} className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 font-medium shadow-sm">
                                        {role}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Security */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Security Preferences
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <button className="w-full text-left px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm mb-3">
                            Change Password
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm">
                            Two-Factor Authentication
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
