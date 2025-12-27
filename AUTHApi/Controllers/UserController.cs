using AUTHApi.Data;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using AUTHApi.Data;

[ApiController]
[Route("api/[controller]")]
[Authorize] // any authenticated user
public class UserController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    public UserController(UserManager<ApplicationUser> userManager) => _userManager = userManager;

    // GET: api/User/profile
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new { user.Id, user.Email, user.UserName, Roles = roles });
    }

    // GET: api/User/users
    // Returns all users filtered based on the current user's role/permissions
    // Replaces the redundant AdminController and ManagerController
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser == null) return Unauthorized();

        var currentUserRoles = await _userManager.GetRolesAsync(currentUser);
        
        var allUsers = _userManager.Users.ToList();
        var result = new System.Collections.Generic.List<object>();
        
        foreach (var user in allUsers)
        {
            var userRoles = await _userManager.GetRolesAsync(user);
            
            // Permission-based filtering logic:
            // - ALWAYS hide SuperAdmin from the management list as per user request
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
                canView = true; // Admin sees all non-SuperAdmins (already filtered above)
            }
            else if (currentUserRoles.Contains("Manager"))
            {
                // Manager sees only regular users (no privileged roles)
                canView = !userRoles.Contains("Admin") && !userRoles.Contains("Manager");
            }
            else
            {
                // For User and custom roles: show nothing or limited? 
                // Usually Users can't see other users unless structured.
                canView = false;
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
        
        return Ok(result);
    }


    // GET: api/User/my-permissions
    // Returns the consolidated permissions for the CURRENT user based on their roles
    [HttpGet("my-permissions")]
    public async Task<IActionResult> GetMyPermissions()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        // 1. Get user's roles
        var roles = await _userManager.GetRolesAsync(user);
        
        var distinctPermissions = new HashSet<string>();

        // 2. Iterate through roles and collect Permission claims
        // Note: In a real app, you might want to cache this or use a claims transformation service.
        // For now, we query the DB for claims of each role.
        var roleManager = HttpContext.RequestServices.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var roleName in roles)
        {
            var role = await roleManager.FindByNameAsync(roleName);
            if (role != null)
            {
                var claims = await roleManager.GetClaimsAsync(role);
                foreach (var claim in claims.Where(c => c.Type == "Permission"))
                {
                    distinctPermissions.Add(claim.Value);
                }
            }
        }
        
        // 3. SuperAdmin Bypass: If user is SuperAdmin, give all Permissions
        if (roles.Contains("SuperAdmin"))
        {
             return Ok(AUTHApi.Core.Security.Permissions.GetAllPermissions());
        }

        return Ok(distinctPermissions);
    }

    // PUT: api/User/profile
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileModel model)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        // simple example: allow changing username
        user.UserName = model.UserName ?? user.UserName;
        user.Email = model.Email ?? user.Email;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(new { message = "Profile updated" });
    }

    // POST: api/User
    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserModel model)
    {
        var user = new ApplicationUser { UserName = model.UserName, Email = model.Email };
        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);

        // Optionally assign role here
        if (!string.IsNullOrWhiteSpace(model.Role))
            await _userManager.AddToRoleAsync(user, model.Role);

        return Ok(new { message = "User created", user.Id, user.UserName, user.Email });
    }

    // DELETE: api/User/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        // Prevent self-deletion
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser?.Id == id) return BadRequest("You cannot delete yourself.");

        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains("SuperAdmin")) return Forbid("SuperAdmin users cannot be deleted via the API.");

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(new { message = "User deleted successfully" });
    }

    public class UpdateProfileModel
    {
        public string UserName { get; set; }
        public string Email { get; set; }
    }

    public class CreateUserModel
    {
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
    }
}