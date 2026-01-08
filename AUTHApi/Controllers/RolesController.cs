using AUTHApi.Data;
using AUTHApi.Entities;
// Timestamp update to force code pick-up
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // Added this using directive
using System.Security.Claims;
using AUTHApi.Core.Security;

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
    [Authorize] // Standardize: allow entry to controller, protect specific methods
    public class RolesController : BaseApiController
    {
        private readonly RoleManager<ApplicationRole> _roleManager; // API to create/delete roles
        private readonly UserManager<ApplicationUser> _userManager; // API to assign roles to users
        private readonly ApplicationDbContext _context;

        public RolesController(RoleManager<ApplicationRole> roleManager, UserManager<ApplicationUser> userManager,
            ApplicationDbContext context)
        {
            _roleManager = roleManager;
            _userManager = userManager;
            _context = context;
        }


        /// <summary>
        /// Retrieves a list of all available roles in the system.
        /// Endpoint: GET /api/Roles
        /// Access: Admin Only
        /// </summary>
        [HttpGet]
        [Authorize(Policy = Permissions.Roles.View)] // Protect the full role list
        public IActionResult GetAllRoles()
        {
            var roles = _roleManager.Roles
                .OrderBy(r => r.OrderLevel ?? -1) // SuperAdmin (null) first
                .Select(r => new { r.Id, r.Name, r.OrderLevel })
                .ToList();
            return Success(new { roles = roles });
        }

        /// <summary>
        /// Creates a new role.
        /// Endpoint: POST /api/Roles/CreateRole
        /// Access: SuperAdmin Only (Higher privilege than normal Admin)
        /// </summary>
        [HttpPost("CreateRole")]
        [Authorize(Policy = Permissions.Roles.Create)] // Only users with Role Create permission
        public async Task<IActionResult> CreateRole([FromBody] DynamicCreateRoleModel model)
        {
            if (string.IsNullOrWhiteSpace(model.RoleName))
            {
                return Failure("RoleName is required");
            }

            if (model.RoleName.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase))
            {
                return Failure("Cannot create or duplicate the SuperAdmin role");
            }

            var roleExists = await _roleManager.RoleExistsAsync(model.RoleName);
            if (roleExists)
            {
                return Failure("Role already exists");
            }

            int assignedOrder;
            if (model.OrderLevel.HasValue)
            {
                assignedOrder = model.OrderLevel.Value;
            }
            else
            {
                // Automatic Order Level Assignment: Start from 1 if no roles exist, 
                // ensuring 0 is left for public/basic maker role.
                var maxOrder = await _roleManager.Roles
                    .Where(r => r.OrderLevel.HasValue)
                    .MaxAsync(r => (int?)r.OrderLevel) ?? 0;
                assignedOrder = maxOrder + 1;
            }

            var role = new ApplicationRole(model.RoleName)
            {
                OrderLevel = assignedOrder
            };

            var result = await _roleManager.CreateAsync(role);

            if (result.Succeeded)
            {
                return Success(new { role = new { role.Id, role.Name, role.OrderLevel } },
                    $"Role '{model.RoleName}' created successfully with Level {role.OrderLevel}");
            }

            return Failure("Failed to create role", 400, result.Errors);
        }

        /// <summary>
        /// Deletes a role by name.
        /// Endpoint: DELETE /api/Roles/DeleteRole/{roleName}
        /// Access: SuperAdmin Only
        /// </summary>
        [HttpDelete("DeleteRole/{roleName}")]
        [Authorize(Policy = Permissions.Roles.Delete)]
        public async Task<IActionResult> DeleteRole(string roleName)
        {
            if (roleName.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase))
            {
                return Failure("Cannot delete system roles");
            }

            // 2. Find and Delete
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null)
            {
                return Failure("Role not found", 404);
            }

            var result = await _roleManager.DeleteAsync(role);
            if (result.Succeeded)
            {
                return Success($"Role '{roleName}' deleted successfully");
            }

            return Failure("Failed to delete role", 400, result.Errors);
        }

        /// <summary>
        /// Gets all users in the system with their roles.
        /// Endpoint: GET /api/Roles/AllUsers
        /// Access: SuperAdmin Only
        /// </summary>
        [HttpGet("AllUsers")]
        [Authorize(Policy = Permissions.Users.View)]
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

            return Success(new { users = userList });
        }

        /// <summary>
        /// Gets all system users.
        /// Endpoint: GET /api/Roles/SystemUsers
        /// </summary>
        [HttpGet("SystemUsers")]
        [Authorize(Policy = Permissions.Users.View)]
        public async Task<IActionResult> GetSystemUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            var userList = new List<object>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userList.Add(new { user.Id, user.Name, user.Email, isActive = user.IsActive, Roles = roles });
            }

            return Success(new { users = userList });
        }

        /// <summary>
        /// Gets users that are managed by the currently logged-in Admin.
        /// Endpoint: GET /api/Roles/Admin/users
        /// Access: Admin Only
        /// </summary>
        [HttpGet("Admin/users")]
        [Authorize(Policy = Permissions.Users.View)]
        public async Task<IActionResult> GetUsersForAdmin()
        {
            // 1. Identify valid Admin
            var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value; // Extract ID from JWT

            if (string.IsNullOrEmpty(adminId))
            {
                return Failure("Admin ID not found in token.", 401);
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

            return Success(new { users = userList });
        }


        /// <summary>
        /// Assigns a specific role to a user.
        /// Endpoint: POST /api/Roles/AssignRole
        /// Access: Admin Only (implicitly via class-level attribute)
        /// </summary>
        [HttpPost("UpdateRoleOrder")]
        [Authorize(Policy = Permissions.Roles.Edit)]
        public async Task<IActionResult> UpdateRoleOrder([FromBody] UpdateRoleOrderModel model)
        {
            if (string.IsNullOrWhiteSpace(model.RoleName)) return Failure("RoleName is required");

            var role = await _roleManager.FindByNameAsync(model.RoleName);
            if (role == null) return Failure("Role not found");

            if (role.Name == "SuperAdmin") return Failure("Cannot modify SuperAdmin hierarchy");

            role.OrderLevel = model.OrderLevel;
            var result = await _roleManager.UpdateAsync(role);

            if (result.Succeeded)
            {
                return Success(new { roleName = role.Name, newLevel = role.OrderLevel },
                    $"Hierarchy updated for '{role.Name}' to Level {role.OrderLevel}");
            }

            return Failure("Failed to update hierarchy", 400, result.Errors);
        }

        [HttpPost("AssignRole")]
        [Authorize(Policy = Permissions.Roles.Assign)]
        public async Task<IActionResult> AssignRoleToUser([FromBody] AssignRoleModel model)
        {
            // Input Validation
            if (string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.RoleName))
            {
                return Failure("Email and RoleName are required");
            }

            // Lookups
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null) return Failure("User not found", 404);

            var roleExists = await _roleManager.RoleExistsAsync(model.RoleName);
            if (!roleExists) return Failure("Role not found", 404);

            // Execution: Replace Roles logic
            // 1. Get current roles
            var currentRoles = await _userManager.GetRolesAsync(user);

            // 2. Remove all current roles
            if (currentRoles.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                {
                    return Failure("Failed to remove existing roles", 400, removeResult.Errors);
                }
            }

            // 3. Add new role
            var result = await _userManager.AddToRoleAsync(user, model.RoleName);

            if (result.Succeeded)
            {
                return Success($"User role updated to '{model.RoleName}' successfully");
            }

            return Failure("Failed to assign role", 400, result.Errors);
        }

        /// <summary>
        /// Removes a role from a user.
        /// Endpoint: POST /api/Roles/RemoveRole
        /// </summary>
        [HttpPost("RemoveRole")]
        [Authorize(Policy = Permissions.Roles.Assign)]
        public async Task<IActionResult> RemoveRoleFromUser([FromBody] AssignRoleModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.RoleName))
            {
                return Failure("Email and RoleName are required");
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null) return Failure("User not found", 404);

            var isInRole = await _userManager.IsInRoleAsync(user, model.RoleName);
            if (!isInRole)
            {
                return Failure("User does not have this role");
            }

            var result = await _userManager.RemoveFromRoleAsync(user, model.RoleName);
            if (result.Succeeded)
            {
                return Success($"Role '{model.RoleName}' removed from user successfully");
            }

            return Failure("Failed to remove role", 400, result.Errors);
        }

        /// <summary>
        /// Checks which roles a specific user has.
        /// Endpoint: GET /api/Roles/UserRoles/{email}
        /// </summary>
        [HttpGet("UserRoles/{email}")]
        [Authorize(Policy = Permissions.Roles.View)] // Protect specific user role viewing
        public async Task<IActionResult> GetUserRoles(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return Failure("User not found", 404);
            }

            var roles = await _userManager.GetRolesAsync(user);
            return Success(new { email = email, roles = roles });
        }
    }

    /// Model for assigning/removing roles
    public class AssignRoleModel
    {
        public string Email { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
    }

    /// Model for creating roles with explicit hierarchy
    public class DynamicCreateRoleModel
    {
        public string RoleName { get; set; } = string.Empty;
        public int? OrderLevel { get; set; }
    }

    /// Model for updating role hierarchy
    public class UpdateRoleOrderModel
    {
        public string RoleName { get; set; } = string.Empty;
        public int OrderLevel { get; set; }
    }
}


