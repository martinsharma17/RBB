// // Controllers/AdminController.cs
// using AUTHApi.Data;
// using AUTHApi.Entities;
// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Identity;
// using Microsoft.AspNetCore.Mvc;
// using System.Linq;
// using System.Threading.Tasks;

// [ApiController]
// [Route("api/[controller]")]
// [Authorize(Roles = "Admin,SuperAdmin")] // Admins and SuperAdmin
// public class AdminController : ControllerBase
// {
//     //private readonly UserManager<IdentityUser> _userManager;
//     //public AdminController(UserManager<IdentityUser> userManager) => _userManager = userManager;

//     private readonly UserManager<ApplicationUser> _userManager;

//     public AdminController(UserManager<ApplicationUser> userManager)
//     {
//         _userManager = userManager;
//     }
 

//     // GET: api/Admin/users - Returns only regular Users (not Admins/SuperAdmins)
//     [HttpGet("users")]
//     public async Task<IActionResult> GetUsers()
//     {
//         var allUsers = _userManager.Users.ToList();
//         var regularUsers = new System.Collections.Generic.List<object>();

//         foreach (var u in allUsers)
//         {
//             var roles = await _userManager.GetRolesAsync(u);
//             // Only include users who are NOT Admin or SuperAdmin
//             if (!roles.Contains("Admin") && !roles.Contains("SuperAdmin"))
//             {
//                 regularUsers.Add(new
//                 {
//                     u.Id,
//                     u.Email,
//                     u.UserName,
//                     Name = u.UserName,
//                     Roles = roles
//                 });
//             }
//         }

//         return Ok(regularUsers);
//     }
//     // Optionally: Admin can view their own profile
//     [HttpGet("profile")]
//     public async Task<IActionResult> GetProfile()
//     {
//         var user = await _userManager.GetUserAsync(User);
//         if (user == null) return NotFound();
//         var roles = await _userManager.GetRolesAsync(user);
//         return Ok(new { user.Id, user.Email, Roles = roles });
//     }
// }
