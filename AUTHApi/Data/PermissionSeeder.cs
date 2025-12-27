using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AUTHApi.Core.Security;

namespace AUTHApi.Data
{
    /// <summary>
    /// Seeds default permissions for each role.
    /// This ensures that when the application starts, roles have sensible default permissions.
    /// </summary>
    public static class PermissionSeeder
    {
        public static async Task SeedDefaultPermissionsAsync(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // Define default permissions for each role
            var rolePermissions = new Dictionary<string, List<string>>
            {
                // SuperAdmin gets everything (handled in PermissionAuthorizationHandler)
                // But we can still seed them for completeness
                ["SuperAdmin"] = Permissions.GetAllPermissions(),

                // Admin: Full access to Users, Tasks, Projects
                ["Admin"] = new List<string>
                {
                    Permissions.Users.View,
                    Permissions.Users.Create,
                    Permissions.Users.Edit,
                    Permissions.Users.Delete,
                    Permissions.Users.Sidebar,
                    
                    Permissions.Tasks.View,
                    Permissions.Tasks.Sidebar,
                    Permissions.Tasks.ViewList,
                    Permissions.Tasks.CreateList,
                    Permissions.Tasks.EditList,
                    Permissions.Tasks.DeleteList,
                    Permissions.Tasks.SidebarList,
                    Permissions.Tasks.ViewKanban,
                    Permissions.Tasks.CreateKanban,
                    Permissions.Tasks.EditKanban,
                    Permissions.Tasks.DeleteKanban,
                    Permissions.Tasks.SidebarKanban,
                    
                    Permissions.Projects.View,
                    Permissions.Projects.Create,
                    Permissions.Projects.Edit,
                    Permissions.Projects.Delete,
                    Permissions.Projects.Sidebar,
                    
                    Permissions.Analytics.View,
                    Permissions.Analytics.Sidebar,

                    // Admin also gets default view/sidebar for standard modules
                    Permissions.Reports.View, Permissions.Reports.Sidebar,
                    Permissions.Audit.View, Permissions.Audit.Sidebar,
                    Permissions.Roles.View, Permissions.Roles.Sidebar,
                    Permissions.Policies.View, Permissions.Policies.Sidebar,
                    Permissions.Settings.View, Permissions.Settings.Sidebar,
                    Permissions.Notifications.View, Permissions.Notifications.Sidebar,
                    Permissions.Security.View, Permissions.Security.Sidebar,
                    Permissions.Backup.View, Permissions.Backup.Sidebar
                },

                // Manager: Can view and manage tasks, view users
                ["Manager"] = new List<string>
                {
                    Permissions.Users.View,
                    Permissions.Users.Sidebar,
                    
                    Permissions.Tasks.View,
                    Permissions.Tasks.Sidebar,
                    Permissions.Tasks.ViewList,
                    Permissions.Tasks.CreateList,
                    Permissions.Tasks.EditList,
                    Permissions.Tasks.DeleteList,
                    Permissions.Tasks.SidebarList,
                    Permissions.Tasks.ViewKanban,
                    Permissions.Tasks.CreateKanban,
                    Permissions.Tasks.EditKanban,
                    Permissions.Tasks.DeleteKanban,
                    Permissions.Tasks.SidebarKanban,
                    
                    Permissions.Projects.View,
                    Permissions.Projects.Sidebar,
                    Permissions.Analytics.View,
                    Permissions.Analytics.Sidebar,

                    // Manager defaults (limited)
                    Permissions.Reports.View, Permissions.Reports.Sidebar,
                    Permissions.Notifications.View, Permissions.Notifications.Sidebar
                },

                // User: Basic read access to tasks
                ["User"] = new List<string>
                {
                    Permissions.Tasks.View,
                    Permissions.Tasks.Sidebar,
                    Permissions.Tasks.ViewList,
                    Permissions.Tasks.SidebarList,
                    Permissions.Tasks.ViewKanban,
                    Permissions.Tasks.SidebarKanban,
                    Permissions.Notifications.View, 
                    Permissions.Notifications.Sidebar
                }
            };

            foreach (var rolePermission in rolePermissions)
            {
                var roleName = rolePermission.Key;
                var permissions = rolePermission.Value;

                var role = await roleManager.FindByNameAsync(roleName);
                if (role == null)
                {
                    Console.WriteLine($"Role {roleName} not found. Skipping permission seeding.");
                    continue;
                }

                // Get existing permission claims
                var existingClaims = await roleManager.GetClaimsAsync(role);
                var existingPermissions = existingClaims
                    .Where(c => c.Type == "Permission")
                    .Select(c => c.Value)
                    .ToHashSet();

                // Add missing permissions (Policy sync)
                foreach (var permission in permissions)
                {
                    if (!existingPermissions.Contains(permission))
                    {
                        await roleManager.AddClaimAsync(role, new Claim("Permission", permission));
                        Console.WriteLine($"✓ Added missing permission '{permission}' to role '{roleName}'");
                    }
                }
            }

            Console.WriteLine("PERMISSION SEEDING COMPLETE ✔");
        }
    }
}
