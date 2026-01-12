import { useEffect, useState, useCallback } from "react";
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import { getViewComponent } from '../components/dashboard/ViewMapper';
import AddUserModal from '../components/dashboard/AddUserModal';
import AssignRoleModal from '../components/dashboard/AssignRoleModal';

const Dashboard = () => {
    // 1. Auth & Context
    const { token, logout, apiBase, user, permissions, fetchPermissions } = useAuth();
    const navigate = useNavigate();

    // 2. Local State
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeView, setActiveView] = useState("dashboard");
    const [menuItems, setMenuItems] = useState<any[]>([]);

    // Data States (shared across views via props)
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [admins, setAdmins] = useState<any[]>([]);

    // UI States
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState<{ name: string, email: string, password: string, role: string, branchId: string }>({
        name: "", email: "", password: "", role: "User", branchId: ""
    });
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedUserForRole, setSelectedUserForRole] = useState<any | null>(null);

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
                    const { fetchDynamicMenu, mapBackendMenuToSidebar, filterDynamicMenus } = await import('../utils/menuUtils');

                    const rawMenu = await fetchDynamicMenu(apiBase, token);
                    console.log("Dashboard: rawMenu received:", rawMenu);
                    const mappedMenu = mapBackendMenuToSidebar(rawMenu);
                    console.log("Dashboard: mappedMenu:", mappedMenu);

                    if (permissions) {
                        // Pass 'user' object to allow SuperAdmin bypass
                        const filteredMenu = filterDynamicMenus(mappedMenu, permissions, user);
                        setMenuItems(filteredMenu);
                    } else {
                        // If no permissions loaded yet, but we have user..
                        if (user && (user.roles?.includes('SuperAdmin') || user.roles?.includes('Super Admin'))) {
                            setMenuItems(mappedMenu);
                        } else {
                            setMenuItems([]);
                        }
                    }
                } catch (err) {
                    console.error("Failed to load menu", err);
                } finally {
                }
            }
        };
        loadMenu();
    }, [token, apiBase, permissions]);

    // 5. Data Fetching (Users, Roles)
    const fetchData = useCallback(async () => {
        if (!permissions || !permissions.read_users) return;

        try {
            // Fetch Users
            const userRes = await fetch(`${apiBase}/api/User/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.ok) {
                const res = await userRes.json();
                const data = res.data || [];
                setUsers(data);
                const adminList = data.filter((u: any) => {
                    const r = u.roles || u.Roles || [];
                    return r.includes("Admin") || r.includes("SuperAdmin");
                });
                setAdmins(adminList);
            }

            // Fetch Roles 
            if (permissions.view_roles || permissions.read_roles) {
                const roleRes = await fetch(`${apiBase}/api/Roles`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (roleRes.ok) {
                    const res = await roleRes.json();
                    const data = res.data || {};
                    const newRoles = data.roles || [];

                    // Only update state if data changed to avoid re-renders
                    if (JSON.stringify(newRoles) !== JSON.stringify(roles)) {
                        setRoles(newRoles);
                    }
                }
            }

        } catch (err) {
            console.error("Data fetch error:", err);
        } finally {
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
        try {
            const body = {
                UserName: newUser.name, // Display name fallback
                Name: newUser.name,     // Explicit Name field
                Email: newUser.email,
                Password: newUser.password,
                Role: newUser.role || "User",
                BranchId: (newUser.branchId && newUser.branchId !== "") ? parseInt(newUser.branchId) : null
            };

            console.log("Adding user with body:", body);

            const response = await fetch(`${apiBase}/api/User`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const resData = await response.json();

            if (response.ok && resData.success) {
                setShowAddModal(false);
                setNewUser({ name: "", email: "", password: "", role: "User", branchId: "" });
                fetchData();
            } else {
                console.error("Failed to add user:", resData);
                const errorMsg = resData.message || "Failed to add user";
                const validationErrors = resData.errors ? JSON.stringify(resData.errors) : "";
                alert(`${errorMsg}\n${validationErrors}`);
            }
        } catch (e) {
            console.error("Error adding user:", e);
            alert("Error adding user. Check console for details.");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm("Delete user?")) return;
        try {
            await fetch(`${apiBase}/api/User/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (e) { }
    }

    // 7. Render
    if (!token) return null;

    const handleAssignRole = (user: any) => {
        setSelectedUserForRole(user);
        setShowAssignModal(true);
    };

    const handleRoleUpdate = async (email: string, newRole: string) => {
        try {
            const response = await fetch(`${apiBase}/api/Roles/AssignRole`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ Email: email, RoleName: newRole })
            });

            if (response.ok) {
                setShowAssignModal(false);
                fetchData();
            } else {
                const data = await response.json();
                alert(data.message || "Failed to assign role");
            }
        } catch (e) {
            console.error(e);
            alert("Error assigning role");
        }
    };

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
                    {getViewComponent(activeView, {
                        users,
                        admins,
                        roles: roles.filter(r => (r.Name || r.name || r) !== "SuperAdmin"), // Filter SuperAdmin here for views
                        totalUsers: users.length,
                        totalAdmins: admins.length,
                        totalAccounts: users.length,

                        onAddUser: permissions?.create_users ? () => setShowAddModal(true) : null,
                        onDelete: handleDeleteUser,
                        onAssignRole: handleAssignRole,
                        onViewUsers: () => setActiveView('users'),
                        onViewCharts: () => setActiveView('charts'),

                        permissions,
                        user,
                        token,
                        apiBase,
                        onPermissionsUpdated: () => {
                            if (token && fetchPermissions) {
                                console.log("Dashboard: Policy updated, triggering permission refresh...");
                                fetchPermissions(token);
                            }
                        }
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
                allowRoleSelection={true}
                roles={roles.filter(r => (r.Name || r.name || r) !== "SuperAdmin")}
            />

            <AssignRoleModal
                show={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                user={selectedUserForRole}
                roles={roles}
                onAssign={handleRoleUpdate}
            />
        </div>
    );
};

export default Dashboard;
