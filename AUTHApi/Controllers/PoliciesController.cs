using AUTHApi.Core.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AUTHApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin")] // Only SuperAdmin can manage policies for now
    public class PoliciesController : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager;

        public PoliciesController(RoleManager<IdentityRole> roleManager)
        {
            _roleManager = roleManager;
        }

        // GET: api/policies/{roleName}
        // Returns the list of PERMISSION claims assigned to this role
        [HttpGet("{roleName}")]
        public async Task<IActionResult> GetRolePermissions(string roleName)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null) return NotFound("Role not found");

            var claims = await _roleManager.GetClaimsAsync(role);
            var permissions = claims
                .Where(c => c.Type == "Permission")
                .Select(c => c.Value)
                .ToList();

            return Ok(new { Role = roleName, Permissions = permissions });
        }

        // PUT: api/policies/{roleName}
        // Updates the permissions for the role (Replaces existing permissions)
        [HttpPut("{roleName}")]
        public async Task<IActionResult> UpdateRolePermissions(string roleName, [FromBody] List<string> newPermissions)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null) return NotFound("Role not found");

            // Handle null input as empty list
            newPermissions = newPermissions ?? new List<string>();

            Console.WriteLine($"📝 Updating permissions for role '{roleName}':");
            Console.WriteLine($"   New permissions count: {newPermissions.Count}");

            // 1. Get existing claims
            var currentClaims = await _roleManager.GetClaimsAsync(role);
            
            // 2. Identify Permission claims to remove
            var permissionsToRemove = currentClaims.Where(c => c.Type == "Permission").ToList();
            
            Console.WriteLine($"   Removing {permissionsToRemove.Count} old permissions...");
            
            // 3. Remove them ALL (even if newPermissions is empty)
            foreach (var claim in permissionsToRemove)
            {
                await _roleManager.RemoveClaimAsync(role, claim);
                Console.WriteLine($"   ✓ Removed: {claim.Value}");
            }

            // 4. Add new permissions as Claims (if any)
            if (newPermissions.Count > 0)
            {
                Console.WriteLine($"   Adding {newPermissions.Count} new permissions...");
                foreach (var permission in newPermissions)
                {
                    await _roleManager.AddClaimAsync(role, new Claim("Permission", permission));
                    Console.WriteLine($"   ✓ Added: {permission}");
                }
            }
            else
            {
                Console.WriteLine($"   ⊘ No new permissions to add (role will have ZERO permissions)");
            }

            Console.WriteLine($"✅ Permission update complete for '{roleName}'");
            return Ok(new { Message = $"Permissions updated for role {roleName}", Count = newPermissions.Count });
        }
    }
}
