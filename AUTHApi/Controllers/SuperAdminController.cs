// Controllers/SuperAdminController.cs

using AUTHApi.Data;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;

namespace AUTHApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")] // Only SuperAdmin can call these endpoints
public class SuperAdminController : BaseApiController
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public SuperAdminController(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    // GET: api/SuperAdmin/users
    [HttpGet("users")]
    public IActionResult GetAllUsers()
    {
        var users = _userManager.Users.Select(u => new
        {
            u.Id,
            u.UserName,
            // u.Email, // This was original
            u.Email,
            u.IsActive
        }).ToList();

        return Success(users);
    }

    // GET: api/SuperAdmin/admins
    [HttpGet("admins")]
    public async Task<IActionResult> GetAllAdmins()
    {
        var admins = (await _userManager.GetUsersInRoleAsync("Admin"))
            .Select(u => new { u.Id, u.Email, u.UserName, u.IsActive })
            .ToList();
        return Success(admins);
    }

    // POST: api/SuperAdmin/promote/{userId}
    [HttpPost("promote/{userId}")]
    public async Task<IActionResult> PromoteToAdmin(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Failure("User not found", 404);

        if (!await _roleManager.RoleExistsAsync("Admin"))
            await _roleManager.CreateAsync(new IdentityRole("Admin"));

        if (await _userManager.IsInRoleAsync(user, "Admin"))
            return Failure("User is already an admin");

        var result = await _userManager.AddToRoleAsync(user, "Admin");
        if (!result.Succeeded)
            return Failure("Failed to promote user", 400, result.Errors);

        return Success(new { userId = user.Id }, "User promoted to Admin");
    }

    // Optionally: GET: api/SuperAdmin/users-with-roles
    [HttpGet("users-with-roles")]
    public async Task<IActionResult> GetUsersWithRoles()
    {
        var allUsers = _userManager.Users.ToList();
        var results = new System.Collections.Generic.List<object>();
        foreach (var u in allUsers)
        {
            var roles = await _userManager.GetRolesAsync(u);
            results.Add(new { u.Id, u.Email, Roles = roles });
        }

        return Success(results);
    }

    // DELETE: api/SuperAdmin/delete/{userId}
    [HttpDelete("delete/{userId}")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Failure("User not found", 404);

        // Prevent deleting SuperAdmin
        if (await _userManager.IsInRoleAsync(user, "SuperAdmin"))
            return Failure("Cannot delete SuperAdmin");

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return Failure("Failed to delete user", 400, result.Errors);

        return Success("User deleted successfully");
    }

    // POST: api/SuperAdmin/revoke-admin/{userId}
    [HttpPost("revoke-admin/{userId}")]
    public async Task<IActionResult> RevokeAdminAccess(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Failure("User not found", 404);

        if (!await _userManager.IsInRoleAsync(user, "Admin"))
            return Failure("User is not an admin");

        var result = await _userManager.RemoveFromRoleAsync(user, "Admin");
        if (!result.Succeeded)
            return Failure("Failed to revoke admin access", 400, result.Errors);

        // Ensure user has User role
        if (!await _userManager.IsInRoleAsync(user, "User"))
        {
            await _userManager.AddToRoleAsync(user, "User");
        }

        return Success("Admin access revoked successfully");
    }

    // POST: api/SuperAdmin/toggle-status/{userId}
    [HttpPost("toggle-status/{userId}")]
    public async Task<IActionResult> ToggleUserStatus(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Failure("User not found", 404);

        // Prevent deactivating yourself if you are the logged in SuperAdmin
        var currentUserId = _userManager.GetUserId(User);
        if (userId == currentUserId)
        {
            return Failure("You cannot deactivate yourself.");
        }

        // Prevent deactivating ANY SuperAdmin
        if (await _userManager.IsInRoleAsync(user, "SuperAdmin"))
        {
            return Failure("Cannot deactivate a SuperAdmin account.");
        }

        user.IsActive = !user.IsActive;
        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
            return Failure("Failed to update user status", 400, result.Errors);

        return Success(new { isActive = user.IsActive }, user.IsActive ? "User activated" : "User deactivated");
    }
}
