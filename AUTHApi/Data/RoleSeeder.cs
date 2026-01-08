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

            if (!await userManager.IsInRoleAsync(superAdmin, "Admin"))
                await userManager.AddToRoleAsync(superAdmin, "Admin");

            if (!await userManager.IsInRoleAsync(superAdmin, "User"))
                await userManager.AddToRoleAsync(superAdmin, "User");

            Console.WriteLine("SUPER ADMIN READY ✔");

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
