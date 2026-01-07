using AUTHApi.Data;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Authorization;
using AUTHApi.Core.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace AUTHApi.Controllers;

/// <summary>
/// Controller for user profile and user management operations.
/// Provides endpoints for viewing/updating profiles, managing users, and retrieving permissions.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize] // Loosen class balance: any authenticated user can fetch their own profile/perms
public class UserController : BaseApiController
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public UserController(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    /// <summary>
    /// Retrieves the current authenticated user's profile information.
    /// </summary>
    /// <returns>User profile including ID, email, username, and roles.</returns>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Failure("User not found", 404);

        var roles = await _userManager.GetRolesAsync(user);
        return Success(new { user.Id, user.Email, user.UserName, Roles = roles });
    }

    /// <summary>
    /// Retrieves all users filtered based on the current user's role and permissions.
    /// SuperAdmin sees all non-SuperAdmin users, Admin sees all except SuperAdmin,
    /// Manager sees only regular users.
    /// </summary>
    /// <returns>List of users with their basic information and roles.</returns>
    [HttpGet("users")]
    [Authorize(Policy = Permissions.Users.View)] // Strictly protect the full user list
    public async Task<IActionResult> GetAllUsers()
    {
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser == null) return Failure("Unauthorized", 401);

        var currentUserRoles = await _userManager.GetRolesAsync(currentUser);
        var allUsers = await _userManager.Users.ToListAsync();

        // Batch load user-role mappings to avoid N+1 query problem
        // This fetches all role assignments in a single query
        var userRolesDict = new Dictionary<string, IList<string>>();
        foreach (var user in allUsers)
        {
            userRolesDict[user.Id] = await _userManager.GetRolesAsync(user);
        }

        var result = new List<object>();

        foreach (var user in allUsers)
        {
            var userRoles = userRolesDict[user.Id];

            // Permission-based filtering logic:
            // - ALWAYS hide SuperAdmin from the management list
            // - SuperAdmin sees everyone else
            // - Admin sees managers and regular users
            // - Manager sees only regular users
            if (userRoles.Contains("SuperAdmin")) continue;

            bool canView = false;

            if (currentUserRoles.Contains("SuperAdmin"))
            {
                canView = true;
            }
            else if (currentUserRoles.Contains("Admin"))
            {
                canView = true;
            }
            else if (currentUserRoles.Contains("Manager"))
            {
                // Manager sees only regular users (no privileged roles)
                canView = !userRoles.Contains("Admin") && !userRoles.Contains("Manager");
            }

            if (canView)
            {
                result.Add(new
                {
                    user.Id,
                    user.Email,
                    user.UserName,
                    user.IsActive,
                    Name = user.UserName,
                    Roles = userRoles
                });
            }
        }

        return Success(result);
    }


    /// <summary>
    /// Retrieves the consolidated permissions for the current authenticated user.
    /// SuperAdmin users automatically receive all permissions.
    /// Other users receive permissions based on their role policies.
    /// </summary>
    /// <returns>List of granted permission keys.</returns>
    [HttpGet("my-permissions")]
    public async Task<IActionResult> GetMyPermissions()
    {
        var context = HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Failure("User not found", 404);

        var roles = await _userManager.GetRolesAsync(user);

        // SuperAdmin Bypass: Grant all permissions
        if (roles.Contains("SuperAdmin"))
        {
            return Success(AUTHApi.Core.Security.Permissions.GetAllPermissions());
        }

        // Resolve effective permissions from RolePolicy table
        var roleIds = await context.Roles
            .Where(r => r.Name != null && roles.Contains(r.Name))
            .Select(r => r.Id)
            .ToListAsync();

        var grantedPolicyKeys = await context.RolePolicies
            .Where(rp => roleIds.Contains(rp.RoleId) && rp.IsGranted)
            .Join(context.SystemPolicies,
                rp => rp.PolicyId,
                p => p.Id,
                (rp, p) => p.PolicyKey)
            .Distinct()
            .ToListAsync();

        return Success(grantedPolicyKeys);
    }

    /// <summary>
    /// Updates the current user's profile information.
    /// </summary>
    /// <param name="model">Profile data to update (username, email).</param>
    /// <returns>Success or failure message.</returns>
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileModel model)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Failure("User not found", 404);

        user.UserName = model.UserName ?? user.UserName;
        user.Email = model.Email ?? user.Email;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return Failure("Failed to update profile", 400, result.Errors);

        return Success("Profile updated");
    }

    /// <summary>
    /// Creates a new user account. Requires SuperAdmin or Admin role.
    /// </summary>
    /// <param name="model">User creation data including username, email, password, and optional role.</param>
    /// <returns>Created user's basic information.</returns>
    [HttpPost]
    [Authorize(Policy = Permissions.Users.Create)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserModel model)
    {
        var user = new ApplicationUser { UserName = model.UserName, Email = model.Email };
        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded) return Failure("Failed to create user", 400, result.Errors);

        if (!string.IsNullOrWhiteSpace(model.Role))
            await _userManager.AddToRoleAsync(user, model.Role);

        return Success(new { user.Id, user.UserName, user.Email }, "User created");
    }

    /// <summary>
    /// Deletes a user account. Requires SuperAdmin or Admin role.
    /// SuperAdmin users cannot be deleted via this endpoint.
    /// </summary>
    /// <param name="id">User ID to delete.</param>
    /// <returns>Success or failure message.</returns>
    [HttpDelete("{id}")]
    [Authorize(Policy = Permissions.Users.Delete)]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return Failure("User not found", 404);

        // Prevent self-deletion
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser?.Id == id) return Failure("You cannot delete yourself.");

        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains("SuperAdmin")) return Failure("SuperAdmin users cannot be deleted via the API.", 403);

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded) return Failure("Failed to delete user", 400, result.Errors);

        return Success("User deleted successfully");
    }
}

#region DTOs

/// <summary>
/// DTO for updating user profile information.
/// </summary>
public class UpdateProfileModel
{
    /// <summary>New username (optional).</summary>
    public string? UserName { get; set; }

    /// <summary>New email address (optional).</summary>
    public string? Email { get; set; }
}

/// <summary>
/// DTO for creating a new user account.
/// </summary>
public class CreateUserModel
{
    /// <summary>Username for the new account.</summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>Email address for the new account.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Password for the new account.</summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>Role to assign (optional).</summary>
    public string? Role { get; set; }
}

#endregion