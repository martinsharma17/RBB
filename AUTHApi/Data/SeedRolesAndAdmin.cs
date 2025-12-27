// // Data/SeedRolesAndAdmin.cs
// using System;
// using System.Threading.Tasks;
// using Microsoft.AspNetCore.Identity;
// using Microsoft.Extensions.DependencyInjection;

// public static class SeedRolesAndAdmin
// {
//     // Call this from Program.cs or Startup.cs after building the host
//     public static async Task SeedAsync(IServiceProvider serviceProvider)
//     {
//         using var scope = serviceProvider.CreateScope();
//         var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
//         var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();

//         // Roles we need
//         string[] roles = new[] { "SuperAdmin", "Admin", "User" };

//         foreach (var role in roles)
//         {
//             if (!await roleManager.RoleExistsAsync(role))
//             {
//                 await roleManager.CreateAsync(new IdentityRole(role));
//             }
//         }

//         // SuperAdmin account details - DEV ONLY
//         var superAdminEmail = "martinsharma18@gmail.com";
//         var superAdminPassword = "Martin#123";

//         var superAdmin = await userManager.FindByEmailAsync(superAdminEmail);
//         if (superAdmin == null)
//         {
//             superAdmin = new IdentityUser
//             {
//                 UserName = superAdminEmail,
//                 Email = superAdminEmail,
//                 EmailConfirmed = true
//             };

//             var createResult = await userManager.CreateAsync(superAdmin, superAdminPassword);
//             if (!createResult.Succeeded)
//             {
//                 // Log the error(s) - you can replace with logger
//                 foreach (var err in createResult.Errors)
//                 {
//                     Console.WriteLine($"Error creating superadmin: {err.Code} - {err.Description}");
//                 }
//                 return;
//             }
//         }

//         // Ensure SuperAdmin role
//         if (!await userManager.IsInRoleAsync(superAdmin, "SuperAdmin"))
//         {
//             await userManager.AddToRoleAsync(superAdmin, "SuperAdmin");
//         }

//         // Ensure User role as well for consistency
//         if (!await userManager.IsInRoleAsync(superAdmin, "User"))
//         {
//             await userManager.AddToRoleAsync(superAdmin, "User");
//         }

//         Console.WriteLine("SeedRolesAndAdmin completed.");
//     }
// }
