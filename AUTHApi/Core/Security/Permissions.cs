namespace AUTHApi.Core.Security
{
    public static class Permissions
    {
        public static class Users
        {
            public const string View = "Permissions.Users.View";
            public const string Create = "Permissions.Users.Create";
            public const string Edit = "Permissions.Users.Edit";
            public const string Delete = "Permissions.Users.Delete";
            public const string Sidebar = "Permissions.Users.Sidebar";
        }

        public static class Tasks
        {
            public const string View = "Permissions.Tasks.View"; // Generic parent view
            public const string Sidebar = "Permissions.Tasks.Sidebar";

            // Task List
            public const string ViewList = "Permissions.Tasks.List.View";
            public const string CreateList = "Permissions.Tasks.List.Create";
            public const string EditList = "Permissions.Tasks.List.Edit";
            public const string DeleteList = "Permissions.Tasks.List.Delete";
            public const string SidebarList = "Permissions.Tasks.List.Sidebar";

            // Task Kanban
            public const string ViewKanban = "Permissions.Tasks.Kanban.View";
            public const string CreateKanban = "Permissions.Tasks.Kanban.Create";
            public const string EditKanban = "Permissions.Tasks.Kanban.Edit";
            public const string DeleteKanban = "Permissions.Tasks.Kanban.Delete";
            public const string SidebarKanban = "Permissions.Tasks.Kanban.Sidebar";
        }

        public static class Projects
        {
            public const string View = "Permissions.Projects.View";
            public const string Create = "Permissions.Projects.Create";
            public const string Edit = "Permissions.Projects.Edit";
            public const string Delete = "Permissions.Projects.Delete";
            public const string Sidebar = "Permissions.Projects.Sidebar";

            // Level 2: My Projects
            public const string ViewMyProjects = "Permissions.Projects.MyProjects.View";
            public const string CreateMyProjects = "Permissions.Projects.MyProjects.Create";
            public const string EditMyProjects = "Permissions.Projects.MyProjects.Edit";
            public const string DeleteMyProjects = "Permissions.Projects.MyProjects.Delete";
            public const string SidebarMyProjects = "Permissions.Projects.MyProjects.Sidebar";

            // Level 3: Project Content
            public const string ViewContent = "Permissions.Projects.Content.View";
            public const string CreateContent = "Permissions.Projects.Content.Create";
            public const string EditContent = "Permissions.Projects.Content.Edit";
            public const string DeleteContent = "Permissions.Projects.Content.Delete";
            public const string SidebarContent = "Permissions.Projects.Content.Sidebar";

            // Level 4: Team & Workflow
            public const string ViewTeam = "Permissions.Projects.Team.View";
            public const string CreateTeam = "Permissions.Projects.Team.Create";
            public const string EditTeam = "Permissions.Projects.Team.Edit";
            public const string DeleteTeam = "Permissions.Projects.Team.Delete";
            public const string SidebarTeam = "Permissions.Projects.Team.Sidebar";

            // Level 5: Project Settings
            public const string ViewSettings = "Permissions.Projects.Settings.View";
            public const string CreateSettings = "Permissions.Projects.Settings.Create";
            public const string EditSettings = "Permissions.Projects.Settings.Edit";
            public const string DeleteSettings = "Permissions.Projects.Settings.Delete";
            public const string SidebarSettings = "Permissions.Projects.Settings.Sidebar";
        }

        public static class Analytics
        {
            public const string View = "Permissions.Analytics.View";
            public const string Sidebar = "Permissions.Analytics.Sidebar";
        }

        public static class Reports
        {
            public const string View = "Permissions.Reports.View";
            public const string Sidebar = "Permissions.Reports.Sidebar";
        }

        public static class Audit
        {
            public const string View = "Permissions.Audit.View";
            public const string Sidebar = "Permissions.Audit.Sidebar";
        }

        public static class Roles
        {
            public const string View = "Permissions.Roles.View";
            public const string Create = "Permissions.Roles.Create";
            public const string Edit = "Permissions.Roles.Edit";
            public const string Delete = "Permissions.Roles.Delete";
            public const string Assign = "Permissions.Roles.Assign"; // Assign roles to users
            public const string Sidebar = "Permissions.Roles.Sidebar";
        }

        public static class Policies
        {
            public const string View = "Permissions.Policies.View";
            public const string Sidebar = "Permissions.Policies.Sidebar";
        }

        public static class Settings
        {
            public const string View = "Permissions.Settings.View";
            public const string Sidebar = "Permissions.Settings.Sidebar";
        }

        public static class Notifications
        {
            public const string View = "Permissions.Notifications.View";
            public const string Sidebar = "Permissions.Notifications.Sidebar";
        }

        public static class Security
        {
            public const string View = "Permissions.Security.View";
            public const string Sidebar = "Permissions.Security.Sidebar";
        }

        public static class Backup
        {
            public const string View = "Permissions.Backup.View";
            public const string Sidebar = "Permissions.Backup.Sidebar";
        }

        public static class Kyc
        {
            public const string View = "Permissions.Kyc.View";
            public const string Create = "Permissions.Kyc.Create";
            public const string Edit = "Permissions.Kyc.Edit";
            public const string Delete = "Permissions.Kyc.Delete";
            public const string Workflow = "Permissions.Kyc.Workflow"; // Staff Queue access
            public const string Sidebar = "Permissions.Kyc.Sidebar";
            public const string GlobalSearch = "Permissions.Kyc.GlobalSearch"; // Cross-branch search
            public const string Dashboard = "Permissions.Kyc.Dashboard";
            public const string Export = "Permissions.Kyc.Export"; // CSV/Excel export
            public const string ApprovedView = "Permissions.Kyc.ApprovedView"; // For viewing approved records
        }

        public static class Branches
        {
            public const string View = "Permissions.Branches.View";
            public const string Create = "Permissions.Branches.Create";
            public const string Edit = "Permissions.Branches.Edit";
            public const string Delete = "Permissions.Branches.Delete";
            public const string Sidebar = "Permissions.Branches.Sidebar";
        }

        // Helper to get all permissions for seeding or listing
        public static List<string> GetAllPermissions()
        {
            return new List<string>
            {
                Users.View, Users.Create, Users.Edit, Users.Delete, Users.Sidebar,
                Tasks.View, Tasks.Sidebar,
                Tasks.ViewList, Tasks.CreateList, Tasks.EditList, Tasks.DeleteList, Tasks.SidebarList,
                Tasks.ViewKanban, Tasks.CreateKanban, Tasks.EditKanban, Tasks.DeleteKanban, Tasks.SidebarKanban,
                Projects.View, Projects.Create, Projects.Edit, Projects.Delete, Projects.Sidebar,
                Projects.ViewMyProjects, Projects.CreateMyProjects, Projects.EditMyProjects, Projects.DeleteMyProjects,
                Projects.SidebarMyProjects,
                Projects.ViewContent, Projects.CreateContent, Projects.EditContent, Projects.DeleteContent,
                Projects.SidebarContent,
                Projects.ViewTeam, Projects.CreateTeam, Projects.EditTeam, Projects.DeleteTeam, Projects.SidebarTeam,
                Projects.ViewSettings, Projects.CreateSettings, Projects.EditSettings, Projects.DeleteSettings,
                Projects.SidebarSettings,
                Analytics.View, Analytics.Sidebar,
                Reports.View, Reports.Sidebar,
                Audit.View, Audit.Sidebar,
                Roles.View, Roles.Create, Roles.Edit, Roles.Delete, Roles.Assign, Roles.Sidebar,
                Policies.View, Policies.Sidebar,
                Settings.View, Settings.Sidebar,
                Notifications.View, Notifications.Sidebar,
                Security.View, Security.Sidebar,
                Backup.View, Backup.Sidebar,
                Kyc.View, Kyc.Create, Kyc.Edit, Kyc.Delete, Kyc.Workflow,
                Kyc.Sidebar, Kyc.GlobalSearch, Kyc.Dashboard, Kyc.Export, Kyc.ApprovedView,
                Branches.View, Branches.Create, Branches.Edit, Branches.Delete, Branches.Sidebar
            };
        }
    }
}
