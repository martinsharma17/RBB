// using Microsoft.AspNetCore.Identity;

// public static class SeedRoles
// {
//     public static async Task Initialize(RoleManager<IdentityRole> roleManager)
//     {
//         string[] roles = { "Admin", "User" };

//         foreach (var role in roles)
//         {
//             if (!await roleManager.RoleExistsAsync(role))
//             {
//                 await roleManager.CreateAsync(new IdentityRole(role));
//             }
//         }
//     }
// }
