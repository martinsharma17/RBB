// src/utils/permissionMapper.ts
import type { Permissions } from '../types';

/**
 * ===================================================================================
 * 🛠️ DEVELOPER GUIDE: PERMISSION MAPPING
 * ===================================================================================
 * 
 * This file acts as the BRIDGE between Backend C# Permissions and Frontend React Logic.
 * 
 * 🔄 FLOW:
 * 1. Backend sends list of strings: ["Permissions.Users.View", "Permissions.Tasks.Edit"]
 * 2. This file converts them into a usable Object: { view_users: true, update_tasks: true }
 * 
 * ➕ HOW TO ADD A NEW PERMISSION:
 * 1. Add the backend string constant to `PERMISSION_CONSTANTS`.
 *    (Must match `Permissions.cs` in Backend).
 * 2. Update `mapBackendPermissionsToFrontend`:
 *    - Add a new key to the returned object (e.g., `view_new_feature`).
 *    - logical check on `permSet.has(...)`.
 * 3. Use this new key in `sidebarItems.tsx` or your components.
 * ===================================================================================
 */

/**
 * Maps backend permission strings (e.g., "Permissions.Tasks.ViewList") 
 * to the frontend permission structure used by dashboards.
 */

export const PERMISSION_CONSTANTS = {
    // Users
    USERS_VIEW: 'Permissions.Users.View',
    USERS_CREATE: 'Permissions.Users.Create',
    USERS_EDIT: 'Permissions.Users.Edit',
    USERS_DELETE: 'Permissions.Users.Delete',
    USERS_SIDEBAR: 'Permissions.Users.Sidebar',

    // Tasks
    TASKS_VIEW: 'Permissions.Tasks.View',
    TASKS_SIDEBAR: 'Permissions.Tasks.Sidebar',

    // Task List
    TASKS_LIST_VIEW: 'Permissions.Tasks.List.View',
    TASKS_LIST_CREATE: 'Permissions.Tasks.List.Create',
    TASKS_LIST_EDIT: 'Permissions.Tasks.List.Edit',
    TASKS_LIST_DELETE: 'Permissions.Tasks.List.Delete',
    TASKS_LIST_SIDEBAR: 'Permissions.Tasks.List.Sidebar',

    // Task Kanban
    TASKS_KANBAN_VIEW: 'Permissions.Tasks.Kanban.View',
    TASKS_KANBAN_CREATE: 'Permissions.Tasks.Kanban.Create',
    TASKS_KANBAN_EDIT: 'Permissions.Tasks.Kanban.Edit',
    TASKS_KANBAN_DELETE: 'Permissions.Tasks.Kanban.Delete',
    TASKS_KANBAN_SIDEBAR: 'Permissions.Tasks.Kanban.Sidebar',

    // Projects
    PROJECTS_VIEW: 'Permissions.Projects.View',
    PROJECTS_CREATE: 'Permissions.Projects.Create',
    PROJECTS_EDIT: 'Permissions.Projects.Edit',
    PROJECTS_DELETE: 'Permissions.Projects.Delete',
    PROJECTS_SIDEBAR: 'Permissions.Projects.Sidebar',

    // Nested Levels
    MY_PROJECTS_VIEW: 'Permissions.Projects.MyProjects.View',
    MY_PROJECTS_CREATE: 'Permissions.Projects.MyProjects.Create',
    MY_PROJECTS_EDIT: 'Permissions.Projects.MyProjects.Edit',
    MY_PROJECTS_DELETE: 'Permissions.Projects.MyProjects.Delete',
    MY_PROJECTS_SIDEBAR: 'Permissions.Projects.MyProjects.Sidebar',

    PROJECT_CONTENT_VIEW: 'Permissions.Projects.Content.View',
    PROJECT_CONTENT_CREATE: 'Permissions.Projects.Content.Create',
    PROJECT_CONTENT_EDIT: 'Permissions.Projects.Content.Edit',
    PROJECT_CONTENT_DELETE: 'Permissions.Projects.Content.Delete',
    PROJECT_CONTENT_SIDEBAR: 'Permissions.Projects.Content.Sidebar',

    PROJECT_TEAM_VIEW: 'Permissions.Projects.Team.View',
    PROJECT_TEAM_CREATE: 'Permissions.Projects.Team.Create',
    PROJECT_TEAM_EDIT: 'Permissions.Projects.Team.Edit',
    PROJECT_TEAM_DELETE: 'Permissions.Projects.Team.Delete',
    PROJECT_TEAM_SIDEBAR: 'Permissions.Projects.Team.Sidebar',

    PROJECT_SETTINGS_VIEW: 'Permissions.Projects.Settings.View',
    PROJECT_SETTINGS_CREATE: 'Permissions.Projects.Settings.Create',
    PROJECT_SETTINGS_EDIT: 'Permissions.Projects.Settings.Edit',
    PROJECT_SETTINGS_DELETE: 'Permissions.Projects.Settings.Delete',
    PROJECT_SETTINGS_SIDEBAR: 'Permissions.Projects.Settings.Sidebar',

    // Analytics
    ANALYTICS_VIEW: 'Permissions.Analytics.View',
    ANALYTICS_SIDEBAR: 'Permissions.Analytics.Sidebar',

    // Other Modules
    REPORTS_VIEW: 'Permissions.Reports.View',
    REPORTS_SIDEBAR: 'Permissions.Reports.Sidebar',

    AUDIT_VIEW: 'Permissions.Audit.View',
    AUDIT_SIDEBAR: 'Permissions.Audit.Sidebar',

    ROLES_VIEW: 'Permissions.Roles.View',
    ROLES_SIDEBAR: 'Permissions.Roles.Sidebar',
    
    POLICIES_VIEW: 'Permissions.Policies.View',
    POLICIES_SIDEBAR: 'Permissions.Policies.Sidebar',

    SETTINGS_VIEW: 'Permissions.Settings.View',
    SETTINGS_SIDEBAR: 'Permissions.Settings.Sidebar',

    NOTIFICATIONS_VIEW: 'Permissions.Notifications.View',
    NOTIFICATIONS_SIDEBAR: 'Permissions.Notifications.Sidebar',

    SECURITY_VIEW: 'Permissions.Security.View',
    SECURITY_SIDEBAR: 'Permissions.Security.Sidebar',

    BACKUP_VIEW: 'Permissions.Backup.View',
    BACKUP_SIDEBAR: 'Permissions.Backup.Sidebar',
} as const;

/**
 * Converts an array of backend permission strings to the frontend permission object structure.
 */
export function mapBackendPermissionsToFrontend(backendPermissions: string[]): Permissions {
    const permSet = new Set(backendPermissions);

    return {
        // Users
        users: {
            create: permSet.has(PERMISSION_CONSTANTS.USERS_CREATE),
            read: permSet.has(PERMISSION_CONSTANTS.USERS_VIEW),
            update: permSet.has(PERMISSION_CONSTANTS.USERS_EDIT),
            delete: permSet.has(PERMISSION_CONSTANTS.USERS_DELETE),
            sidebar: permSet.has(PERMISSION_CONSTANTS.USERS_SIDEBAR),
        },

        // Analytics
        analytics: {
            read: permSet.has(PERMISSION_CONSTANTS.ANALYTICS_VIEW),
            sidebar: permSet.has(PERMISSION_CONSTANTS.ANALYTICS_SIDEBAR),
        },
        permission_charts: { // Charts acts as analytics alias
             sidebar: permSet.has(PERMISSION_CONSTANTS.ANALYTICS_SIDEBAR),
        },

        // Tasks (Parent)
        tasks: {
            create: permSet.has(PERMISSION_CONSTANTS.TASKS_LIST_CREATE) || permSet.has(PERMISSION_CONSTANTS.TASKS_KANBAN_CREATE),
            read: permSet.has(PERMISSION_CONSTANTS.TASKS_VIEW),
            update: permSet.has(PERMISSION_CONSTANTS.TASKS_LIST_EDIT) || permSet.has(PERMISSION_CONSTANTS.TASKS_KANBAN_EDIT),
            delete: permSet.has(PERMISSION_CONSTANTS.TASKS_LIST_DELETE) || permSet.has(PERMISSION_CONSTANTS.TASKS_KANBAN_DELETE),
            sidebar: permSet.has(PERMISSION_CONSTANTS.TASKS_SIDEBAR),
        },

        // Task List
        task_list: {
            create: permSet.has(PERMISSION_CONSTANTS.TASKS_LIST_CREATE),
            read: permSet.has(PERMISSION_CONSTANTS.TASKS_LIST_VIEW),
            update: permSet.has(PERMISSION_CONSTANTS.TASKS_LIST_EDIT),
            delete: permSet.has(PERMISSION_CONSTANTS.TASKS_LIST_DELETE),
            sidebar: permSet.has(PERMISSION_CONSTANTS.TASKS_LIST_SIDEBAR),
        },

        // Task Kanban
        task_kanban: {
            create: permSet.has(PERMISSION_CONSTANTS.TASKS_KANBAN_CREATE),
            read: permSet.has(PERMISSION_CONSTANTS.TASKS_KANBAN_VIEW),
            update: permSet.has(PERMISSION_CONSTANTS.TASKS_KANBAN_EDIT),
            delete: permSet.has(PERMISSION_CONSTANTS.TASKS_KANBAN_DELETE),
            sidebar: permSet.has(PERMISSION_CONSTANTS.TASKS_KANBAN_SIDEBAR),
        },

        // Projects
        projects: {
            create: permSet.has(PERMISSION_CONSTANTS.PROJECTS_CREATE),
            read: permSet.has(PERMISSION_CONSTANTS.PROJECTS_VIEW),
            update: permSet.has(PERMISSION_CONSTANTS.PROJECTS_EDIT),
            delete: permSet.has(PERMISSION_CONSTANTS.PROJECTS_DELETE),
            sidebar: permSet.has(PERMISSION_CONSTANTS.PROJECTS_SIDEBAR),
        },
        my_projects: {
            create: permSet.has(PERMISSION_CONSTANTS.MY_PROJECTS_CREATE),
            read: permSet.has(PERMISSION_CONSTANTS.MY_PROJECTS_VIEW),
            update: permSet.has(PERMISSION_CONSTANTS.MY_PROJECTS_EDIT),
            delete: permSet.has(PERMISSION_CONSTANTS.MY_PROJECTS_DELETE),
            sidebar: permSet.has(PERMISSION_CONSTANTS.MY_PROJECTS_SIDEBAR),
        },
        project_content: {
            create: permSet.has(PERMISSION_CONSTANTS.PROJECT_CONTENT_CREATE),
            read: permSet.has(PERMISSION_CONSTANTS.PROJECT_CONTENT_VIEW),
            update: permSet.has(PERMISSION_CONSTANTS.PROJECT_CONTENT_EDIT),
            delete: permSet.has(PERMISSION_CONSTANTS.PROJECT_CONTENT_DELETE),
            sidebar: permSet.has(PERMISSION_CONSTANTS.PROJECT_CONTENT_SIDEBAR),
        },
        project_team: {
            create: permSet.has(PERMISSION_CONSTANTS.PROJECT_TEAM_CREATE),
            read: permSet.has(PERMISSION_CONSTANTS.PROJECT_TEAM_VIEW),
            update: permSet.has(PERMISSION_CONSTANTS.PROJECT_TEAM_EDIT),
            delete: permSet.has(PERMISSION_CONSTANTS.PROJECT_TEAM_DELETE),
            sidebar: permSet.has(PERMISSION_CONSTANTS.PROJECT_TEAM_SIDEBAR),
        },
        project_settings: {
            create: permSet.has(PERMISSION_CONSTANTS.PROJECT_SETTINGS_CREATE),
            read: permSet.has(PERMISSION_CONSTANTS.PROJECT_SETTINGS_VIEW),
            update: permSet.has(PERMISSION_CONSTANTS.PROJECT_SETTINGS_EDIT),
            delete: permSet.has(PERMISSION_CONSTANTS.PROJECT_SETTINGS_DELETE),
            sidebar: permSet.has(PERMISSION_CONSTANTS.PROJECT_SETTINGS_SIDEBAR),
        },

        // Regular Modules
        reports: {
            read: permSet.has(PERMISSION_CONSTANTS.REPORTS_VIEW),
            sidebar: permSet.has(PERMISSION_CONSTANTS.REPORTS_SIDEBAR),
        },
        audit: {
            read: permSet.has(PERMISSION_CONSTANTS.AUDIT_VIEW),
            sidebar: permSet.has(PERMISSION_CONSTANTS.AUDIT_SIDEBAR),
        },
        roles: {
            read: permSet.has(PERMISSION_CONSTANTS.ROLES_VIEW),
            sidebar: permSet.has(PERMISSION_CONSTANTS.ROLES_SIDEBAR),
        },
        policies: {
            read: permSet.has(PERMISSION_CONSTANTS.POLICIES_VIEW),
            sidebar: permSet.has(PERMISSION_CONSTANTS.POLICIES_SIDEBAR),
        },
        settings: {
            read: permSet.has(PERMISSION_CONSTANTS.SETTINGS_VIEW),
            sidebar: permSet.has(PERMISSION_CONSTANTS.SETTINGS_SIDEBAR),
        },
        notifications: {
            read: permSet.has(PERMISSION_CONSTANTS.NOTIFICATIONS_VIEW),
            sidebar: permSet.has(PERMISSION_CONSTANTS.NOTIFICATIONS_SIDEBAR),
        },
        security: {
            read: permSet.has(PERMISSION_CONSTANTS.SECURITY_VIEW),
            sidebar: permSet.has(PERMISSION_CONSTANTS.SECURITY_SIDEBAR),
        },
        backup: {
            read: permSet.has(PERMISSION_CONSTANTS.BACKUP_VIEW),
            sidebar: permSet.has(PERMISSION_CONSTANTS.BACKUP_SIDEBAR),
        },

        // Computed permissions for convenience
        create_users: permSet.has(PERMISSION_CONSTANTS.USERS_CREATE),
        read_users: permSet.has(PERMISSION_CONSTANTS.USERS_VIEW),
        update_users: permSet.has(PERMISSION_CONSTANTS.USERS_EDIT),
        delete_users: permSet.has(PERMISSION_CONSTANTS.USERS_DELETE),

        create_task_list: permSet.has(PERMISSION_CONSTANTS.TASKS_LIST_CREATE),
        read_task_list: permSet.has(PERMISSION_CONSTANTS.TASKS_LIST_VIEW),
        update_task_list: permSet.has(PERMISSION_CONSTANTS.TASKS_LIST_EDIT),
        delete_task_list: permSet.has(PERMISSION_CONSTANTS.TASKS_LIST_DELETE),

        create_task_kanban: permSet.has(PERMISSION_CONSTANTS.TASKS_KANBAN_CREATE),
        read_task_kanban: permSet.has(PERMISSION_CONSTANTS.TASKS_KANBAN_VIEW),
        update_task_kanban: permSet.has(PERMISSION_CONSTANTS.TASKS_KANBAN_EDIT),
        delete_task_kanban: permSet.has(PERMISSION_CONSTANTS.TASKS_KANBAN_DELETE),

        create_projects: permSet.has(PERMISSION_CONSTANTS.PROJECTS_CREATE),
        read_projects: permSet.has(PERMISSION_CONSTANTS.PROJECTS_VIEW),
        update_projects: permSet.has(PERMISSION_CONSTANTS.PROJECTS_EDIT),
        delete_projects: permSet.has(PERMISSION_CONSTANTS.PROJECTS_DELETE),

        // Sidebar-specific permissions (for sidebarItems.tsx filtering)
        view_users: permSet.has(PERMISSION_CONSTANTS.USERS_SIDEBAR),
        view_charts: permSet.has(PERMISSION_CONSTANTS.ANALYTICS_SIDEBAR),
        view_analytics: permSet.has(PERMISSION_CONSTANTS.ANALYTICS_SIDEBAR),

        // Projects Sidebar
        view_projects: permSet.has(PERMISSION_CONSTANTS.PROJECTS_SIDEBAR),
        view_my_projects: permSet.has(PERMISSION_CONSTANTS.MY_PROJECTS_SIDEBAR),
        view_project_content: permSet.has(PERMISSION_CONSTANTS.PROJECT_CONTENT_SIDEBAR),
        view_project_team: permSet.has(PERMISSION_CONSTANTS.PROJECT_TEAM_SIDEBAR),
        view_project_settings: permSet.has(PERMISSION_CONSTANTS.PROJECT_SETTINGS_SIDEBAR),

        view_tasks: permSet.has(PERMISSION_CONSTANTS.TASKS_SIDEBAR),
        view_task_list: permSet.has(PERMISSION_CONSTANTS.TASKS_LIST_SIDEBAR),
        view_task_kanban: permSet.has(PERMISSION_CONSTANTS.TASKS_KANBAN_SIDEBAR),

        view_roles: permSet.has(PERMISSION_CONSTANTS.ROLES_SIDEBAR),
        view_policies: permSet.has(PERMISSION_CONSTANTS.POLICIES_SIDEBAR),
        view_reports: permSet.has(PERMISSION_CONSTANTS.REPORTS_SIDEBAR),
        view_audit: permSet.has(PERMISSION_CONSTANTS.AUDIT_SIDEBAR),
        view_notifications: permSet.has(PERMISSION_CONSTANTS.NOTIFICATIONS_SIDEBAR),
        view_settings: permSet.has(PERMISSION_CONSTANTS.SETTINGS_SIDEBAR),
        view_security: permSet.has(PERMISSION_CONSTANTS.SECURITY_SIDEBAR),
        view_backup: permSet.has(PERMISSION_CONSTANTS.BACKUP_SIDEBAR),
        
        dashboard: true, // Dashboard is always visible
    };
}

/**
 * Converts frontend permission object back to backend permission array.
 * Used by PolicyEditorView when saving.
 */
export function mapFrontendPermissionsToBackend(frontendPermissions: Permissions): string[] {
    const permissions: string[] = [];

    // Helper to push permissions
    const pushIfTrue = (value: boolean | undefined, constant: string): void => {
        if (value) permissions.push(constant);
    };

    // Users
    pushIfTrue(frontendPermissions.users?.create, PERMISSION_CONSTANTS.USERS_CREATE);
    pushIfTrue(frontendPermissions.users?.read, PERMISSION_CONSTANTS.USERS_VIEW);
    pushIfTrue(frontendPermissions.users?.update, PERMISSION_CONSTANTS.USERS_EDIT);
    pushIfTrue(frontendPermissions.users?.delete, PERMISSION_CONSTANTS.USERS_DELETE);
    pushIfTrue(frontendPermissions.users?.sidebar, PERMISSION_CONSTANTS.USERS_SIDEBAR);

    // Tasks Parent
    pushIfTrue(frontendPermissions.tasks?.read, PERMISSION_CONSTANTS.TASKS_VIEW);
    pushIfTrue(frontendPermissions.tasks?.sidebar, PERMISSION_CONSTANTS.TASKS_SIDEBAR);

    // Task List
    pushIfTrue(frontendPermissions.task_list?.create, PERMISSION_CONSTANTS.TASKS_LIST_CREATE);
    pushIfTrue(frontendPermissions.task_list?.read, PERMISSION_CONSTANTS.TASKS_LIST_VIEW);
    pushIfTrue(frontendPermissions.task_list?.update, PERMISSION_CONSTANTS.TASKS_LIST_EDIT);
    pushIfTrue(frontendPermissions.task_list?.delete, PERMISSION_CONSTANTS.TASKS_LIST_DELETE);
    pushIfTrue(frontendPermissions.task_list?.sidebar, PERMISSION_CONSTANTS.TASKS_LIST_SIDEBAR);

    // Task Kanban
    pushIfTrue(frontendPermissions.task_kanban?.create, PERMISSION_CONSTANTS.TASKS_KANBAN_CREATE);
    pushIfTrue(frontendPermissions.task_kanban?.read, PERMISSION_CONSTANTS.TASKS_KANBAN_VIEW);
    pushIfTrue(frontendPermissions.task_kanban?.update, PERMISSION_CONSTANTS.TASKS_KANBAN_EDIT);
    pushIfTrue(frontendPermissions.task_kanban?.delete, PERMISSION_CONSTANTS.TASKS_KANBAN_DELETE);
    pushIfTrue(frontendPermissions.task_kanban?.sidebar, PERMISSION_CONSTANTS.TASKS_KANBAN_SIDEBAR);

    // Projects (Parent)
    pushIfTrue(frontendPermissions.projects?.create, PERMISSION_CONSTANTS.PROJECTS_CREATE);
    pushIfTrue(frontendPermissions.projects?.read, PERMISSION_CONSTANTS.PROJECTS_VIEW);
    pushIfTrue(frontendPermissions.projects?.update, PERMISSION_CONSTANTS.PROJECTS_EDIT);
    pushIfTrue(frontendPermissions.projects?.delete, PERMISSION_CONSTANTS.PROJECTS_DELETE);
    pushIfTrue(frontendPermissions.projects?.sidebar, PERMISSION_CONSTANTS.PROJECTS_SIDEBAR);

    // My Projects
    pushIfTrue(frontendPermissions.my_projects?.create, PERMISSION_CONSTANTS.MY_PROJECTS_CREATE);
    pushIfTrue(frontendPermissions.my_projects?.read, PERMISSION_CONSTANTS.MY_PROJECTS_VIEW);
    pushIfTrue(frontendPermissions.my_projects?.update, PERMISSION_CONSTANTS.MY_PROJECTS_EDIT);
    pushIfTrue(frontendPermissions.my_projects?.delete, PERMISSION_CONSTANTS.MY_PROJECTS_DELETE);
    pushIfTrue(frontendPermissions.my_projects?.sidebar, PERMISSION_CONSTANTS.MY_PROJECTS_SIDEBAR);

    // Project Content
    pushIfTrue(frontendPermissions.project_content?.create, PERMISSION_CONSTANTS.PROJECT_CONTENT_CREATE);
    pushIfTrue(frontendPermissions.project_content?.read, PERMISSION_CONSTANTS.PROJECT_CONTENT_VIEW);
    pushIfTrue(frontendPermissions.project_content?.update, PERMISSION_CONSTANTS.PROJECT_CONTENT_EDIT);
    pushIfTrue(frontendPermissions.project_content?.delete, PERMISSION_CONSTANTS.PROJECT_CONTENT_DELETE);
    pushIfTrue(frontendPermissions.project_content?.sidebar, PERMISSION_CONSTANTS.PROJECT_CONTENT_SIDEBAR);

    // Project Team
    pushIfTrue(frontendPermissions.project_team?.create, PERMISSION_CONSTANTS.PROJECT_TEAM_CREATE);
    pushIfTrue(frontendPermissions.project_team?.read, PERMISSION_CONSTANTS.PROJECT_TEAM_VIEW);
    pushIfTrue(frontendPermissions.project_team?.update, PERMISSION_CONSTANTS.PROJECT_TEAM_EDIT);
    pushIfTrue(frontendPermissions.project_team?.delete, PERMISSION_CONSTANTS.PROJECT_TEAM_DELETE);
    pushIfTrue(frontendPermissions.project_team?.sidebar, PERMISSION_CONSTANTS.PROJECT_TEAM_SIDEBAR);

    // Project Settings
    pushIfTrue(frontendPermissions.project_settings?.create, PERMISSION_CONSTANTS.PROJECT_SETTINGS_CREATE);
    pushIfTrue(frontendPermissions.project_settings?.read, PERMISSION_CONSTANTS.PROJECT_SETTINGS_VIEW);
    pushIfTrue(frontendPermissions.project_settings?.update, PERMISSION_CONSTANTS.PROJECT_SETTINGS_EDIT);
    pushIfTrue(frontendPermissions.project_settings?.delete, PERMISSION_CONSTANTS.PROJECT_SETTINGS_DELETE);
    pushIfTrue(frontendPermissions.project_settings?.sidebar, PERMISSION_CONSTANTS.PROJECT_SETTINGS_SIDEBAR);

    // Analytics
    if (frontendPermissions.analytics?.read) {
        pushIfTrue(true, PERMISSION_CONSTANTS.ANALYTICS_VIEW);
    }
    pushIfTrue(frontendPermissions.analytics?.sidebar, PERMISSION_CONSTANTS.ANALYTICS_SIDEBAR);

    // Other Modules
    pushIfTrue(frontendPermissions.reports?.read, PERMISSION_CONSTANTS.REPORTS_VIEW);
    pushIfTrue(frontendPermissions.reports?.sidebar, PERMISSION_CONSTANTS.REPORTS_SIDEBAR);

    pushIfTrue(frontendPermissions.audit?.read, PERMISSION_CONSTANTS.AUDIT_VIEW);
    pushIfTrue(frontendPermissions.audit?.sidebar, PERMISSION_CONSTANTS.AUDIT_SIDEBAR);

    pushIfTrue(frontendPermissions.roles?.read, PERMISSION_CONSTANTS.ROLES_VIEW);
    pushIfTrue(frontendPermissions.roles?.sidebar, PERMISSION_CONSTANTS.ROLES_SIDEBAR);

    pushIfTrue(frontendPermissions.policies?.read, PERMISSION_CONSTANTS.POLICIES_VIEW);
    pushIfTrue(frontendPermissions.policies?.sidebar, PERMISSION_CONSTANTS.POLICIES_SIDEBAR);

    pushIfTrue(frontendPermissions.settings?.read, PERMISSION_CONSTANTS.SETTINGS_VIEW);
    pushIfTrue(frontendPermissions.settings?.sidebar, PERMISSION_CONSTANTS.SETTINGS_SIDEBAR);

    pushIfTrue(frontendPermissions.notifications?.read, PERMISSION_CONSTANTS.NOTIFICATIONS_VIEW);
    pushIfTrue(frontendPermissions.notifications?.sidebar, PERMISSION_CONSTANTS.NOTIFICATIONS_SIDEBAR);

    pushIfTrue(frontendPermissions.security?.read, PERMISSION_CONSTANTS.SECURITY_VIEW);
    pushIfTrue(frontendPermissions.security?.sidebar, PERMISSION_CONSTANTS.SECURITY_SIDEBAR);

    pushIfTrue(frontendPermissions.backup?.read, PERMISSION_CONSTANTS.BACKUP_VIEW);
    pushIfTrue(frontendPermissions.backup?.sidebar, PERMISSION_CONSTANTS.BACKUP_SIDEBAR);

    return permissions;
}
