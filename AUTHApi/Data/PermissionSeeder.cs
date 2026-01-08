using AUTHApi.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using AUTHApi.Core.Security;

namespace AUTHApi.Data
{
    /// <summary>
    /// Seeds default policies and role assignations.
    /// 1. Syncs all permission constants from code into 'SystemPolicies' table.
    /// 2. Assigns default policies to roles in 'RolePolicies' table.
    /// </summary>
    public static class PermissionSeeder
    {
        public static async Task SeedDefaultPermissionsAsync(IServiceProvider serviceProvider)
        {
            var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<ApplicationRole>>();

            // 1. Seed System Policies
            var allPermissions = Permissions.GetAllPermissions();
            foreach (var permKey in allPermissions)
            {
                if (!await context.SystemPolicies.AnyAsync(p => p.PolicyKey == permKey))
                {
                    // Basic parsing for display
                    // "Permissions.Users.View" -> Category: Users, Name: View
                    var parts = permKey.Split('.');
                    string category = parts.Length > 1 ? parts[1] : "General";
                    string name = parts.Length > 2 ? string.Join(" ", parts.Skip(2)) : parts.Last();

                    context.SystemPolicies.Add(new SystemPolicy
                    {
                        PolicyKey = permKey,
                        Category = category,
                        DisplayName = $"{category}: {name}",
                        Description = $"Auto-generated policy for {permKey}"
                    });
                }
            }

            await context.SaveChangesAsync();

            // 2. Define Default Role Assignments (Code-First)
            // This map defines the "Golden State" for new deployments
            var defaultRoleMap = new Dictionary<string, List<string>>
            {
                ["SuperAdmin"] = allPermissions // Only SuperAdmin gets everything by default
            };

            // 3. Apply Role Assignments
            foreach (var item in defaultRoleMap)
            {
                var roleName = item.Key;
                var policyKeys = item.Value;

                var role = await roleManager.FindByNameAsync(roleName);
                if (role == null) continue;

                foreach (var key in policyKeys)
                {
                    var policy = await context.SystemPolicies.FirstOrDefaultAsync(p => p.PolicyKey == key);
                    if (policy == null) continue;

                    // Check if link exists
                    if (!await context.RolePolicies.AnyAsync(rp => rp.RoleId == role.Id && rp.PolicyId == policy.Id))
                    {
                        context.RolePolicies.Add(new RolePolicy
                        {
                            RoleId = role.Id,
                            PolicyId = policy.Id,
                            IsGranted = true
                        });
                    }
                }
            }

            await context.SaveChangesAsync();

            Console.WriteLine("PERMISSION & POLICY SEEDING COMPLETE ✔");
        }
    }
}
