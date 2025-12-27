using AUTHApi.Data;
using AUTHApi.Entities;
// Timestamp update to force code pick-up
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // Added this using directive
using System.Security.Claims; // Added this using directive

namespace AUTHApi.Controllers
{

    /// <summary>
    /// Controller for managing roles and permissions.
    /// Base URL: /api/Roles
    /// 
    /// SECURITY NOTE:
    /// Most endpoints here are protected by [Authorize(Policy = "AdminOnly")].
    /// This means even if a user has a valid token, they must have the "Admin" role
    /// to access these endpoints.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "AdminOnly")]  // CLASS-LEVEL SECURITY: Applies to ALL methods unless overridden
    public class RolesController : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager; // API to create/delete roles
        private readonly UserManager<ApplicationUser> _userManager; // API to assign roles to users

        public RolesController(RoleManager<IdentityRole> roleManager, UserManager<ApplicationUser> userManager)
        {
            _roleManager = roleManager;
            _userManager = userManager;
        }


        /// <summary>
        /// Retrieves a list of all available roles in the system.
        /// Endpoint: GET /api/Roles
        /// Access: Admin Only
        /// </summary>
        [HttpGet]
        public IActionResult GetAllRoles()
        {
            // Project to anonymous object to hide internal details if any
            var roles = _roleManager.Roles.Select(r => new { r.Id, r.Name }).ToList();
            return Ok(new { success = true, roles = roles });
        }

        /// <summary>
        /// Creates a new role.
        /// Endpoint: POST /api/Roles/CreateRole
        /// Access: SuperAdmin Only (Higher privilege than normal Admin)
        /// </summary>
        [HttpPost("CreateRole")]
        [Authorize(Roles = "SuperAdmin")] // METHOD-LEVEL SECURITY: Only SuperAdmin can create roles
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleModel model)
        {
            // 1. Validation
            if (string.IsNullOrWhiteSpace(model.RoleName))
            {
                return BadRequest(new { success = false, message = "RoleName is required" });
            }

            // 2. Check existence
            var roleExists = await _roleManager.RoleExistsAsync(model.RoleName);
            if (roleExists)
            {
                return BadRequest(new { success = false, message = "Role already exists" });
            }

            // 3. Create Role
            var role = new IdentityRole(model.RoleName);
            var result = await _roleManager.CreateAsync(role);
            
            if (result.Succeeded)
            {
                return Ok(new { success = true, message = $"Role '{model.RoleName}' created successfully", role = new { role.Id, role.Name } });
            }

            return BadRequest(new { success = false, message = "Failed to create role", errors = result.Errors });
        }

        /// <summary>
        /// Deletes a role by name.
        /// Endpoint: DELETE /api/Roles/DeleteRole/{roleName}
        /// Access: SuperAdmin Only
        /// </summary>
        [HttpDelete("DeleteRole/{roleName}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> DeleteRole(string roleName)
        {
            // 1. Protect Critical Roles
            // We should never delete the basic system roles or we break the app.
            var systemRoles = new[] { "SuperAdmin", "Admin", "User" };
            if (systemRoles.Contains(roleName))
            {
                return BadRequest(new { success = false, message = "Cannot delete system roles" });
            }

            // 2. Find and Delete
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null)
            {
                return NotFound(new { success = false, message = "Role not found" });
            }

            var result = await _roleManager.DeleteAsync(role);
            if (result.Succeeded)
            {
                return Ok(new { success = true, message = $"Role '{roleName}' deleted successfully" });
            }

            return BadRequest(new { success = false, message = "Failed to delete role", errors = result.Errors });
        }

        /// <summary>
        /// Gets all users in the system with their roles.
        /// Endpoint: GET /api/Roles/AllUsers
        /// Access: SuperAdmin Only
        /// </summary>
        [HttpGet("AllUsers")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            var userList = new List<object>();

            // Loop users to fetch their roles individually
            // Note: In a large system, this loop might be slow (N+1 problem).
            // Better to use a JOIN query in EF Core for production.
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userList.Add(new { user.Id, user.Name, user.Email, isActive = user.IsActive, Roles = roles });
            }

            return Ok(new { success = true, users = userList });
        }

        /// <summary>
        /// Gets all Admin users.
        /// Endpoint: GET /api/Roles/AllAdmins
        /// Access: SuperAdmin Only
        /// </summary>
        [HttpGet("AllAdmins")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetAllAdmins()
        {
            // Helper method from UserManager to find users by role
            var admins = await _userManager.GetUsersInRoleAsync("Admin");
            var adminList = new List<object>();

            foreach (var admin in admins)
            {
                var roles = await _userManager.GetRolesAsync(admin);
                adminList.Add(new { admin.Id, admin.Name, admin.Email, isActive = admin.IsActive, Roles = roles });
            }

            return Ok(new { success = true, admins = adminList });
        }

        /// <summary>
        /// Gets users that are managed by the currently logged-in Admin.
        /// Endpoint: GET /api/Roles/Admin/users
        /// Access: Admin Only
        /// </summary>
        [HttpGet("Admin/users")] 
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsersForAdmin()
        {
            // 1. Identify valid Admin
            var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value; // Extract ID from JWT

            if (string.IsNullOrEmpty(adminId))
            {
                return Unauthorized(new { success = false, message = "Admin ID not found in token." });
            }

            // 2. Fetch users where ManagerId matches this Admin
            // This assumes a hierarchical relationship (Admin -> Users)
            var users = await _userManager.Users
                                        .Where(u => u.ManagerId == adminId)
                                        .ToListAsync();

            var userList = new List<object>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userList.Add(new { user.Id, user.Name, user.Email, isActive = user.IsActive, Roles = roles });
            }

            return Ok(new { success = true, users = userList });
        }


        /// <summary>
        /// Assigns a specific role to a user.
        /// Endpoint: POST /api/Roles/AssignRole
        /// Access: Admin Only (implicitly via class-level attribute)
        /// </summary>
        [HttpPost("AssignRole")]
        public async Task<IActionResult> AssignRoleToUser([FromBody] AssignRoleModel model)
        {
            // Input Validation
            if (string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.RoleName))
            {
                return BadRequest(new { success = false, message = "Email and RoleName are required" });
            }

            // Lookups
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null) return NotFound(new { success = false, message = "User not found" });

            var roleExists = await _roleManager.RoleExistsAsync(model.RoleName);
            if (!roleExists) return NotFound(new { success = false, message = "Role not found" });

            // Execution: Replace Roles logic
            // 1. Get current roles
            var currentRoles = await _userManager.GetRolesAsync(user);

            // 2. Remove all current roles
            if (currentRoles.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                {
                    return BadRequest(new { success = false, message = "Failed to remove existing roles", errors = removeResult.Errors });
                }
            }

            // 3. Add new role
            var result = await _userManager.AddToRoleAsync(user, model.RoleName);
            
            if (result.Succeeded)
            {
                return Ok(new { success = true, message = $"User role updated to '{model.RoleName}' successfully" });
            }

            return BadRequest(new { success = false, message = "Failed to assign role", errors = result.Errors });
        }

        /// <summary>
        /// Removes a role from a user.
        /// Endpoint: POST /api/Roles/RemoveRole
        /// </summary>
        [HttpPost("RemoveRole")]
        public async Task<IActionResult> RemoveRoleFromUser([FromBody] AssignRoleModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.RoleName))
            {
                return BadRequest(new { success = false, message = "Email and RoleName are required" });
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null) return NotFound(new { success = false, message = "User not found" });

            var isInRole = await _userManager.IsInRoleAsync(user, model.RoleName);
            if (!isInRole)
            {
                return BadRequest(new { success = false, message = "User does not have this role" });
            }

            var result = await _userManager.RemoveFromRoleAsync(user, model.RoleName);
            if (result.Succeeded)
            {
                return Ok(new { success = true, message = $"Role '{model.RoleName}' removed from user successfully" });
            }

            return BadRequest(new { success = false, message = "Failed to remove role", errors = result.Errors });
        }

        /// <summary>
        /// Checks which roles a specific user has.
        /// Endpoint: GET /api/Roles/UserRoles/{email}
        /// </summary>
        [HttpGet("UserRoles/{email}")]
        public async Task<IActionResult> GetUserRoles(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return NotFound(new { success = false, message = "User not found" });
            }

            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new { success = true, email = email, roles = roles });
        }
    }

    /// Model for assigning/removing roles
    public class AssignRoleModel
    {
        public string Email { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
    }

    /// Model for creating roles
    public class CreateRoleModel
    {
        public string RoleName { get; set; } = string.Empty;
    }
}


