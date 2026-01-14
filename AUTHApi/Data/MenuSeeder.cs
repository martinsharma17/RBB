using AUTHApi.Entities;
using Microsoft.EntityFrameworkCore;
using AUTHApi.Core.Security;

namespace AUTHApi.Data
{
    public static class MenuSeeder
    {
        public static async Task SeedMenuItemsAsync(ApplicationDbContext context)
        {
            // DEV MODE: Clear existing menu items to apply changes and avoid duplicates
            // This ensures your sidebar always matches this code perfectly.
            context.MenuItems.RemoveRange(context.MenuItems);
            await context.SaveChangesAsync();

            // Load all policies to link them
            var policies = await context.SystemPolicies.ToDictionaryAsync(p => p.PolicyKey, p => p.Id);

            // Helper to get ID
            int? GetPolicyId(string? key) => key != null && policies.TryGetValue(key, out var id) ? id : null;

            // 1. Define Core Top-Level Items
            // Dashboard - Always accessible
            var dashboardItem = new MenuItem
            {
                Title = "Dashboard", ViewId = "dashboard", Icon = "DashboardIcon",
                Url = "/dashboard", // URL for navigation
                Permission = "dashboard",
                RequiredPolicyId = null, // Dashboard usually open or has special handling
                Order = 1
            };
            var kycDashboardItem = new MenuItem
            {
                Title = "KYC Dashboard", ViewId = "kyc_dashboard", Icon = "ChartPieIcon",
                Url = "/kyc-dashboard",
                Permission = Permissions.Kyc.Dashboard,
                RequiredPolicyId = GetPolicyId(Permissions.Kyc.Dashboard),
                Order = 2
            };
            // var profileItem = new MenuItem
            // {
            //     Title = "My Profile", ViewId = "user_profile", Icon = "UserIcon",
            //     Url = "/profile",
            //     Permission = null, Order = 2
            // };
            var usersItem = new MenuItem
            {
                Title = "User Management", ViewId = "users", Icon = "UsersIcon",
                Url = "/users",
                Permission = Permissions.Users.Sidebar,
                RequiredPolicyId = GetPolicyId(Permissions.Users.Sidebar),
                Order = 3
            };
            var rolesItem = new MenuItem
            {
                Title = "Roles & Permissions", ViewId = "roles", Icon = "RolesIcon",
                Url = "/roles",
                Permission = Permissions.Roles.Sidebar,
                RequiredPolicyId = GetPolicyId(Permissions.Roles.Sidebar),
                Order = 4
            };
            var policyItem = new MenuItem
            {
                Title = "Policy Editor", ViewId = "policies", Icon = "PolicyIcon",
                Url = "/policies",
                Permission = Permissions.Policies.Sidebar,
                RequiredPolicyId = GetPolicyId(Permissions.Policies.Sidebar),
                Order = 5
            };
            var branchItem = new MenuItem
            {
                Title = "Branch Management", ViewId = "branches", Icon = "BranchIcon",
                Url = "/branches",
                Permission = Permissions.Branches.Sidebar,
                RequiredPolicyId = GetPolicyId(Permissions.Branches.Sidebar),
                Order = 6
            };

            var kycItem = new MenuItem
            {
                Title = "KYC Verification", ViewId = "kyc", Icon = "KycIcon",
                Url = "/kyc",
                Permission = Permissions.Kyc.Sidebar,
                RequiredPolicyId = GetPolicyId(Permissions.Kyc.Sidebar),
                Order = 6
            };

            var kycWorkflowItem = new MenuItem
            {
                Title = "KYC Approval Queue", ViewId = "kyc_workflow", Icon = "AuditIcon",
                Url = "/kyc-approval",
                Permission = Permissions.Kyc.Workflow,
                RequiredPolicyId = GetPolicyId(Permissions.Kyc.Workflow),
                Order = 7
            };

            var kycUnifiedQueueItem = new MenuItem
            {
                Title = "Unified KYC Queue", ViewId = "kyc_unified_queue", Icon = "Shield",
                Url = "/kyc-unified",
                Permission = Permissions.Kyc.Workflow,
                RequiredPolicyId = GetPolicyId(Permissions.Kyc.Workflow),
                Order = 8
            };

            var kycSearchItem = new MenuItem
            {
                Title = "Global KYC Search", ViewId = "kyc_search", Icon = "SearchIcon",
                Url = "/kyc-search",
                Permission = Permissions.Kyc.GlobalSearch,
                RequiredPolicyId = GetPolicyId(Permissions.Kyc.GlobalSearch),
                Order = 9
            };

            // Menu Management - SuperAdmin only (no permission required, role-based)
            // var menuManagementItem = new MenuItem
            // {
            //     Title = "Menu Management", ViewId = "menu_management", Icon = "MenuIcon",
            //     Url = "/menu-management",
            //     Permission = null, // SuperAdmin only via controller authorization
            //     RequiredPolicyId = null,
            //     Order = 7
            // };


            // var tasksItem = new MenuItem
            // {
            //     Title = "Tasks", ViewId = "tasks", Icon = "TaskIcon",
            //     Url = "/tasks",
            //     Permission = Permissions.Tasks.Sidebar,
            //     RequiredPolicyId = GetPolicyId(Permissions.Tasks.Sidebar),
            //     Order = 8
            // };

            // Remaining Top-Level
            var items = new List<MenuItem>
            {
                dashboardItem,
                kycDashboardItem,
                // profileItem,
                usersItem,
                rolesItem,
                policyItem,
                branchItem,
                kycItem,
                kycWorkflowItem,
                kycUnifiedQueueItem,
                kycSearchItem,

                // tasksItem,
                // new MenuItem
                // {
                //     Title = "Reports", ViewId = "reports", Icon = "ReportsIcon",
                //     Url = "/reports",
                //     Permission = Permissions.Reports.Sidebar,
                //     RequiredPolicyId = GetPolicyId(Permissions.Reports.Sidebar),
                //     Order = 9
                // },
                new MenuItem
                {
                    Title = "Audit Logs", ViewId = "audit", Icon = "AuditIcon",
                    Url = "/audit",
                    Permission = Permissions.Audit.Sidebar,
                    RequiredPolicyId = GetPolicyId(Permissions.Audit.Sidebar),
                    Order = 10
                },
            };

            // Save Top-Level items first (so they get Database IDs)
            foreach (var item in items)
            {
                // Check if exists to avoid doubles if checking by Title/ViewId
                if (!await context.MenuItems.AnyAsync(m => m.ViewId == item.ViewId))
                {
                    await context.MenuItems.AddAsync(item);
                }
            }

            await context.SaveChangesAsync();


            // --- Level 2: Task Nesting ---
            /*
            var taskList = new MenuItem
            {
                Title = "List", ViewId = "task_list",
                Permission = Permissions.Tasks.SidebarList,
                RequiredPolicyId = GetPolicyId(Permissions.Tasks.SidebarList),
                Order = 1,
                ParentId = tasksItem.Id
            };
            var taskKanban = new MenuItem
            {
                Title = "Kanban", ViewId = "task_kanban",
                Permission = Permissions.Tasks.SidebarKanban,
                RequiredPolicyId = GetPolicyId(Permissions.Tasks.SidebarKanban),
                Order = 2,
                ParentId = tasksItem.Id
            };

            if (!await context.MenuItems.AnyAsync(m => m.ViewId == taskList.ViewId))
                await context.MenuItems.AddAsync(taskList);

            if (!await context.MenuItems.AnyAsync(m => m.ViewId == taskKanban.ViewId))
                await context.MenuItems.AddAsync(taskKanban);
*/
            await context.SaveChangesAsync();

            Console.WriteLine("Menu Seeding Successful - Linked to System Policies.");
        }
    }
}