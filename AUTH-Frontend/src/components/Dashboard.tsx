import { useEffect, useState, useCallback } from "react";
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from './dashboard/Sidebar';
import { getViewComponent } from './dashboard/ViewMapper';
import AddUserModal from './dashboard/AddUserModal';
import AssignRoleModal from './dashboard/AssignRoleModal'; // Ensure this exists or remove if unused

const Dashboard = () => {
    // 1. Auth & Context
    const { token, logout, apiBase, user, permissions } = useAuth();
    const navigate = useNavigate();

    // 2. Local State
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeView, setActiveView] = useState("dashboard");
    const [activeId, setActiveId] = useState<number | null>(null);
    const [menuItems, setMenuItems] = useState<any[]>([]);

    // Data States (shared across views via props)
    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [admins, setAdmins] = useState<any[]>([]); // For SuperAdmin view if needed

    // UI States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false); // If needed
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "", branchId: "" });
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
                    console.log("Components/Dashboard: rawMenu received:", rawMenu);
                    const mappedMenu = mapBackendMenuToSidebar(rawMenu);
                    console.log("Components/Dashboard: mappedMenu:", mappedMenu);

                    if (permissions) {
                        // Pass 'user' object to allow SuperAdmin bypass
                        const filteredMenu = filterDynamicMenus(mappedMenu, permissions, user);
                        setMenuItems(filteredMenu);
                    } else {
                        // Wait for permissions to load for accurate filtering
                        setMenuItems([]);
                    }
                } catch (err) {
                    console.error("Failed to load menu", err);
                } finally {
                }
            }
        };
        loadMenu();
    }, [token, apiBase, permissions]);

    // 5. Data Fetching (Users, Roles) - Can be optimized to fetch only when needed
    // For now, we fetch generic lists if permission allows
    const fetchData = useCallback(async () => {
        if (!permissions || !permissions.read_users) return; // Skip if no permission

        try {
            // Fetch Users
            const userRes = await fetch(`${apiBase}/api/User/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.ok) {
                const res = await userRes.json();
                const data = res.data || [];
                setUsers(data);
                // Identification of users with management capabilities can be done by permissions,
                // but for a summary list, showing users with any role other than the most basic might be enough,
                // or just remove this simplified 'admins' state and rely on API filtering.
                setAdmins(data.filter((u: any) => u.roles && u.roles.length > 0));
            }

            // Fetch Roles (if permission allows or if needed for modals)
            if (permissions.view_roles || permissions.read_roles) {
                const roleRes = await fetch(`${apiBase}/api/Roles`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (roleRes.ok) {
                    const res = await roleRes.json();
                    setRoles(res.data?.roles || []);
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
                Role: newUser.role || null,
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
                setNewUser({ name: "", email: "", password: "", role: "", branchId: "" });
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
        if (!window.confirm("Delete user? This action cannot be undone.")) return;
        try {
            const response = await fetch(`${apiBase}/api/User/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const resData = await response.json();
            if (response.ok && resData.success) {
                alert("User deleted successfully");
                fetchData();
            } else {
                alert(resData.message || "Failed to delete user");
            }
        } catch (e) {
            console.error("Error deleting user:", e);
            alert("An error occurred while deleting the user.");
        }
    };

    const handleAssignRole = async (email: string, roleName: string) => {
        try {
            const response = await fetch(`${apiBase}/api/Roles/AssignRole`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ Email: email, RoleName: roleName })
            });

            const resData = await response.json();

            if (response.ok && resData.success) {
                setShowAssignModal(false);
                setSelectedUserForRole(null);
                alert("Role assigned successfully");
                fetchData();
            } else {
                alert(resData.message || "Failed to assign role");
            }
        } catch (e) {
            console.error("Error assigning role:", e);
            alert("Error assigning role. Check console for details.");
        }
    };

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
                        onDelete: permissions?.delete_users ? handleDeleteUser : null,
                        canEdit: !!permissions?.update_users,
                        onAssignRole: (user: any) => {
                            setSelectedUserForRole(user);
                            setShowAssignModal(true);
                        },
                        onViewUsers: () => setActiveView('users'),
                        onViewCharts: () => setActiveView('charts'),
                        onViewChange: (view: string, id?: number) => {
                            setActiveView(view);
                            if (id) setActiveId(id);
                            else setActiveId(null);
                        },

                        // Context
                        workflowId: activeId,
                        onClearActiveId: () => setActiveId(null),
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

            <AssignRoleModal
                show={showAssignModal}
                user={selectedUserForRole}
                roles={roles}
                onClose={() => setShowAssignModal(false)}
                onAssign={handleAssignRole}
            />
        </div>
    );
};

export default Dashboard;
