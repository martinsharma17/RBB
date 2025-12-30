import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Sidebar from './dashboard/Sidebar.jsx';
import { getViewComponent } from './dashboard/ViewMapper.jsx';
import AddUserModal from './dashboard/AddUserModal.jsx';
import AssignRoleModal from './dashboard/AssignRoleModal.jsx'; // Ensure this exists or remove if unused

const Dashboard = () => {
    // 1. Auth & Context
    const { token, logout, apiBase, user, permissions } = useAuth();
    const navigate = useNavigate();

    // 2. Local State
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeView, setActiveView] = useState("dashboard");
    const [menuItems, setMenuItems] = useState([]);
    const [loadingMenu, setLoadingMenu] = useState(true);

    // Data States (shared across views via props)
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [admins, setAdmins] = useState([]); // For SuperAdmin view if needed
    const [loadingData, setLoadingData] = useState(false);

    // UI States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false); // If needed
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
    const [selectedUserForRole, setSelectedUserForRole] = useState(null);

    // 3. Effect: Auth Check
    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    // 4. Effect: Fetch Dynamic Menu
    useEffect(() => {
        const loadMenu = async () => {
            if (token) {
                try {
                    // Lazy load utility to avoid circular dep issues if any
                    const { fetchDynamicMenu, mapBackendMenuToSidebar, filterDynamicMenus } = await import('../utils/menuUtils.jsx');

                    const rawMenu = await fetchDynamicMenu(apiBase, token);
                    const mappedMenu = mapBackendMenuToSidebar(rawMenu);

                    if (permissions) {
                        // Pass 'user' object to allow SuperAdmin bypass
                        const filteredMenu = filterDynamicMenus(mappedMenu, permissions, user);
                        setMenuItems(filteredMenu);
                    } else {
                        // If no permissions loaded yet, but we have user..
                        if (user && (user.roles?.includes('SuperAdmin') || user.roles?.includes('Super Admin'))) {
                            setMenuItems(mappedMenu);
                        } else {
                            // Fallback or empty? Better to wait for permissions.
                            // But if permissions is null, we might show nothing for regular users.
                            setMenuItems([]);
                        }
                    }
                } catch (err) {
                    console.error("Failed to load menu", err);
                } finally {
                    setLoadingMenu(false);
                }
            }
        };
        loadMenu();
    }, [token, apiBase, permissions]);

    // 5. Data Fetching (Users, Roles) - Can be optimized to fetch only when needed
    // For now, we fetch generic lists if permission allows
    const fetchData = useCallback(async () => {
        if (!permissions || !permissions.read_users) return; // Skip if no permission

        setLoadingData(true);
        try {
            // Fetch Users
            const userRes = await fetch(`${apiBase}/api/User/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.ok) {
                const data = await userRes.json();
                setUsers(data);
                // Derive admins if simple list, otherwise separate call needed for SuperAdmin
                const adminList = data.filter(u => u.roles && (u.roles.includes("Admin") || u.roles.includes("SuperAdmin")));
                setAdmins(adminList);
            }

            // Fetch Roles (if permission allows or if needed for modals)
            if (permissions.view_roles || permissions.read_roles) {
                const roleRes = await fetch(`${apiBase}/api/Roles`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (roleRes.ok) {
                    const roleData = await roleRes.json();
                    setRoles(roleData.roles || []);
                }
            }

        } catch (err) {
            console.error("Data fetch error:", err);
        } finally {
            setLoadingData(false);
        }
    }, [apiBase, token, permissions]);

    useEffect(() => {
        if (token) fetchData();
    }, [token, fetchData]);

    // 6. Handlers
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleAddUser = async () => {
        // ... (reuse logic from generic add user)
        // For brevity, basic implementation:
        try {
            const response = await fetch(`${apiBase}/api/User`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    UserName: newUser.name,
                    Email: newUser.email,
                    Password: newUser.password,
                    Role: "User" // Default
                })
            });
            if (response.ok) {
                setShowAddModal(false);
                setNewUser({ name: "", email: "", password: "" });
                fetchData();
            } else {
                alert("Failed to add user");
            }
        } catch (e) { alert("Error adding user"); }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Delete user?")) return;
        try {
            await fetch(`${apiBase}/api/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (e) { }
    }

    // 7. Render
    if (!token) return null; // Or generic loading

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Dynamic Sidebar */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                activeView={activeView}
                setActiveView={setActiveView}
                menuItems={menuItems}
                onLogout={handleLogout}
                user={user}
                permissions={permissions}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-6 md:p-8">
                    {/* 
                       DYNAMIC VIEW RENDERING 
                       We pass all common props to the view. Specific views extract what they need.
                     */}
                    {getViewComponent(activeView, {
                        // Data
                        users,
                        admins,
                        roles,
                        totalUsers: users.length,
                        totalAdmins: admins.length,
                        totalAccounts: users.length, // Placeholder logic

                        // Actions
                        onAddUser: permissions?.create_users ? () => setShowAddModal(true) : null,
                        onDelete: handleDeleteUser,
                        onViewUsers: () => setActiveView('users'),
                        onViewCharts: () => setActiveView('charts'),

                        // Context
                        permissions,
                        token,
                        apiBase
                    })}
                </div>
            </div>

            {/* Modals */}
            <AddUserModal
                show={showAddModal}
                newUser={newUser}
                setNewUser={setNewUser}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAddUser}
                allowRoleSelection={false}
            />
        </div>
    );
};

export default Dashboard;
