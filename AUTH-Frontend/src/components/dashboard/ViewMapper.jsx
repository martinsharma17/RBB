import React from 'react';
import AdminDashboardView from './admin/AdminDashboardView.jsx';
import AdminUsersListView from './admin/AdminUsersListView.jsx';
import AdminChartsView from './admin/AdminChartsView.jsx';
import AccessManagementView from './AccessManagementView.jsx';
import RolesManagementView from './RolesManagementView.jsx';
import PolicyEditorView from './PolicyEditorView.jsx';
import SettingsView from './SettingsView.jsx';
import NotificationsView from './NotificationsView.jsx';
import ProjectSettingsDummy from './ProjectSettingsDummy.jsx';
import AdminResourceView from './admin/AdminResourceView.jsx';
import TaskListView from './tasks/TaskListView.jsx';
import TaskKanbanView from './tasks/TaskKanbanView.jsx';
import KycFormMaster from './user/KycFormMaster.jsx';


/**
 * Maps a viewId (from database/menu) to a React Component.
 * Supports permission checks if needed directly, but usually filtering handles it.
 */
export const getViewComponent = (viewId, props) => {
    switch (viewId) {
        // --- Core Dashboards ---
        case 'dashboard':
            return <AdminDashboardView {...props} />;

        case 'kyc':
            return <KycFormMaster {...props} />;



        case 'support_view':  // This ID must match the 'ViewId' in the backend
            return <SupportComponent {...props} />;

        // --- Users & Roles ---
        case 'users':
            return <AdminUsersListView {...props} />;

        case 'roles':
            return <RolesManagementView {...props} />;
        case 'policies':
            return <PolicyEditorView {...props} />;
        case 'access':
            return <AccessManagementView {...props} />;

        //  mapped viewId 'support_view' to SupportComponent
        // case 'support_view': 
        //     return <SupportComponent {...props} />;


        // --- Analytics ---
        case 'charts':
            return <AdminChartsView {...props} />;

        // --- Tasks ---
        case 'tasks':
            // Generic Parent View (can be generic resource view or a landing page)
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
