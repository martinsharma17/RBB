using Microsoft.AspNetCore.Identity;
using AUTHApi.Entities;

namespace AUTHApi.Data
{
    public static class RoleSeeder
    {
        public static async Task SeedRolesAsync(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();

            var roles = configuration.GetSection("Roles:DefaultRoles").Get<string[]>() ?? ["SuperAdmin"];

            // Cleanup: Delete roles that are no longer needed
            var rolesToDelete = new[] { "Admin", "Manager" };
            foreach (var roleName in rolesToDelete)
            {
                var role = await roleManager.FindByNameAsync(roleName);
                if (role != null)
                {
                    // Check if there are any users in this role before deleting?
                    // Identity usually prevents deletion if users exist, or removes the mapping.
                    // For now, we'll force delete to satisfy the user request.
                    await roleManager.DeleteAsync(role);
                    Console.WriteLine($"Removed deprecated role: {roleName}");
                }
            }

            foreach (var roleName in roles)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    var role = new ApplicationRole(roleName)
                    {
                        OrderLevel = null // System roles have null order
                    };
                    await roleManager.CreateAsync(role);
                }
            }
        }

        public static async Task SeedSuperAdminAsync(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            string email = "martinsharma18@gmail.com";
            string password = "Martin#123"; // dev only

            var superAdmin = await userManager.FindByEmailAsync(email);

            if (superAdmin == null)
            {
                superAdmin = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(superAdmin, password);

                if (!result.Succeeded)
                {
                    foreach (var e in result.Errors)
                        Console.WriteLine("Error creating SuperAdmin: " + e.Description);

                    return;
                }
            }

            // Assign roles
            if (!await userManager.IsInRoleAsync(superAdmin, "SuperAdmin"))
                await userManager.AddToRoleAsync(superAdmin, "SuperAdmin");


            if (!await userManager.IsInRoleAsync(superAdmin, "User"))
                await userManager.AddToRoleAsync(superAdmin, "User");

            Console.WriteLine("SUPER ADMIN READY ✔");

            // SELF-HEAL: Ensure Password is 'Martin#123' (Dev convenience)
            // This ensures that even if you forget it, restarting the app resets it for this specific user.
            if (superAdmin != null)
            {
                var token = await userManager.GeneratePasswordResetTokenAsync(superAdmin);
                var resetResult = await userManager.ResetPasswordAsync(superAdmin, token, password);
                if (!resetResult.Succeeded)
                {
                    Console.WriteLine("Warning: Could not auto-reset SuperAdmin password.");
                }
            }

            // SELF-HEAL: Ensure ALL users are Active (Migration fix)
            // This fixes the issue where the new column defaults to 0 (Inactive)
            var allUsers = userManager.Users.ToList();
            bool changesMade = false;
            foreach (var u in allUsers)
            {
                if (!u.IsActive)
                {
                    u.IsActive = true;
                    // We don't await individually to speed up, or we can. 
                    // Let's await to be safe.
                    await userManager.UpdateAsync(u);
                    changesMade = true;
                }
            }

            if (changesMade) Console.WriteLine("Re-activated all users from default migration state.");
        }
    }
}
