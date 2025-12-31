import React from 'react';
import AdminDashboardView from './admin/AdminDashboardView';
import AdminUsersListView from './admin/AdminUsersListView';
import AdminChartsView from './admin/AdminChartsView';
import AccessManagementView from './AccessManagementView';
import RolesManagementView from './RolesManagementView';
import PolicyEditorView from './PolicyEditorView';
import SettingsView from './SettingsView';
import NotificationsView from './NotificationsView';
import ProjectSettingsDummy from './ProjectSettingsDummy';
import AdminResourceView from './admin/AdminResourceView';
import TaskListView from './tasks/TaskListView';
import TaskKanbanView from './tasks/TaskKanbanView';
import KycFormMaster from './user/KycFormMaster';
import MenuManagementView from './admin/MenuManagementView';


// Placeholder for missing component
const SupportComponent = () => (
    <div className="p-8 text-center text-gray-500">Support Module (Coming Soon)</div>
);

/**
 * Maps a viewId (from database/menu) to a React Component.
 * Supports permission checks if needed directly, but usually filtering handles it.
 */
export const getViewComponent = (viewId: string, props: any): React.ReactNode => {
    switch (viewId) {
        // --- Core Dashboards ---
        case 'dashboard':
            return <AdminDashboardView {...props} />;

        case 'kyc':
            return <KycFormMaster {...props} />;

        case 'support_view':  // This ID must match the 'ViewId' in the backend
            return <SupportComponent />;

        // --- Users & Roles ---
        case 'users':
            return <AdminUsersListView {...props} />;

        case 'roles':
            return <RolesManagementView {...props} />;
        case 'policies':
            return <PolicyEditorView {...props} />;
        case 'menu_management':
            return <MenuManagementView {...props} />;
        case 'access':
            return <AccessManagementView {...props} />;

        // --- Analytics ---
        case 'charts':
            return <AdminChartsView {...props} />;

        // --- Tasks ---
        case 'tasks':
            return <AdminResourceView resourceName="Tasks Overview" {...props} />;
        case 'task_list':
            return <TaskListView {...props} />;
        case 'task_kanban':
            return <TaskKanbanView {...props} />;

        // --- Projects ---
        case 'projects':
            return <AdminResourceView resourceName="Projects Overview" {...props} />;
        case 'my_projects':
            return <AdminResourceView resourceName="My Projects" {...props} />;
        case 'project_content':
            return <AdminResourceView resourceName="Project Content" {...props} />;
        case 'project_team':
            return <AdminResourceView resourceName="Team & Workflow" {...props} />;
        case 'project_settings':
            return <ProjectSettingsDummy {...props} />;

        // --- Commons ---
        case 'settings':
            return <SettingsView {...props} />;
        case 'notifications':
            return <NotificationsView {...props} />;

        // --- Placeholders for future modules ---
        case 'reports':
            return <div className="p-8 text-center text-gray-500">Reports Module (Coming Soon)</div>;
        case 'audit':
            return <div className="p-8 text-center text-gray-500">Audit Logs Module (Coming Soon)</div>;
        case 'security':
            return <div className="p-8 text-center text-gray-500">Security Settings Module (Coming Soon)</div>;
        case 'backup':
            return <div className="p-8 text-center text-gray-500">Backup & Restore Module (Coming Soon)</div>;

        default:
            return (
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900">View Not Found</h3>
                    <p className="text-gray-500">The requested view "{viewId}" does not exist or is not mapped.</p>
                </div>
            );
    }
};
