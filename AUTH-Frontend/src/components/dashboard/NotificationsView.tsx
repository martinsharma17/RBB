
const NotificationsView = () => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Notifications</h2>
            <p className="text-gray-600">You have no new notifications.</p>
            {/* List of notifications would go here */}
            <div className="mt-6">
                <ul className="divide-y divide-gray-200">
                    <li className="py-4">
                        <div className="flex space-x-3">
                            <div className="flex-1 space-y-1">
                                <h3 className="text-sm font-medium">Welcome!</h3>
                                <p className="text-sm text-gray-500">Thanks for joining our platform.</p>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default NotificationsView;
