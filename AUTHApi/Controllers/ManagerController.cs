// using AUTHApi.Data;
// using AUTHApi.Entities;
// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Identity;
// using Microsoft.AspNetCore.Mvc;
// using System.Linq;
// using System.Threading.Tasks;

// [ApiController]
// [Route("api/[controller]")]
// [Authorize(Roles = "Manager")] // Only Managers can call these endpoints
// public class ManagerController : ControllerBase
// {
//     private readonly UserManager<ApplicationUser> _userManager;

//     public ManagerController(UserManager<ApplicationUser> userManager)
//     {
//         _userManager = userManager;
//     }

//     // GET: api/Manager/users - Returns only regular Users (not Admins/SuperAdmins/Managers)
//     [HttpGet("users")]
//     public async Task<IActionResult> GetUsers()
//     {
//         var allUsers = _userManager.Users.ToList();
//         var regularUsers = new System.Collections.Generic.List<object>();

//         foreach (var u in allUsers)
//         {
//             var roles = await _userManager.GetRolesAsync(u);
//             // Only include users who are NOT Admin, SuperAdmin, or Manager
//             if (!roles.Contains("Admin") && !roles.Contains("SuperAdmin") && !roles.Contains("Manager"))
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

//     // Optionally: Manager can view their own profile
//     [HttpGet("profile")]
//     public async Task<IActionResult> GetProfile()
//     {
//         var user = await _userManager.GetUserAsync(User);
//         if (user == null) return NotFound();
//         var roles = await _userManager.GetRolesAsync(user);
//         return Ok(new { user.Id, user.Email, Roles = roles });
//     }
// }
