
const SettingsView = () => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p className="text-gray-600">User settings configuration will go here.</p>
            {/* Add settings form or options here later */}
            <div className="mt-6 space-y-4">
                <div className="border p-4 rounded-md">
                    <h3 className="font-semibold">Profile Settings</h3>
                    <p className="text-sm text-gray-500">Update your personal information.</p>
                </div>
                <div className="border p-4 rounded-md">
                    <h3 className="font-semibold">Security</h3>
                    <p className="text-sm text-gray-500">Change password and security preferences.</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
