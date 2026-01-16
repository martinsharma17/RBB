import AdminDashboardView from './admin/AdminDashboardView';
import AdminUsersListView from './admin/AdminUsersListView';

import AccessManagementView from './AccessManagementView';
import RolesManagementView from './RolesManagementView';
import PolicyEditorView from './PolicyEditorView';
import ProjectSettingsView from './ProjectSettingsView';


// import AdminResourceView from './admin/AdminResourceView';

import KycFormMaster from './user/KycFormMaster';
import MenuManagementView from './admin/MenuManagementView';
import KycWorkflowView from './admin/KycWorkflowView';
import UnifiedKycQueueView from './admin/UnifiedKycQueueView';
import BranchManagementView from './superadmin/BranchManagementView';
import KycSearchView from './admin/KycSearchView';


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

        case 'kyc':
            return <KycFormMaster {...props} />;

        case 'dashboard':
            return <AdminDashboardView {...props} />;

        case 'kyc_workflow':
            return <KycWorkflowView {...props} />;

        case 'kyc_unified_queue':
            return <UnifiedKycQueueView {...props} />;

        case 'kyc_search':
            return <KycSearchView {...props} />;

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
        case 'branches':
            return <BranchManagementView {...props} />;
        case 'system_customization':
            return <ProjectSettingsView {...props} />;

        // --- Analytics ---


        // --- Tasks ---
        // case 'tasks':
        //     return <AdminResourceView resourceName="Tasks Overview" {...props} />;
        // case 'task_list':
        //     return <TaskListView {...props} />;
        // case 'task_kanban':
        //     return <TaskKanbanView {...props} />;



        // --- Placeholders for future modules ---

        default:
            return (
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900">View Not Found</h3>
                    <p className="text-gray-500">The requested view "{viewId}" does not exist or is not mapped.</p>
                </div>
            );
    }
};
