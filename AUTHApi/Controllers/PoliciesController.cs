using AUTHApi.Data;
using AUTHApi.Entities;
using AUTHApi.Core.Security;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AUTHApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin")] // Only SuperAdmin can manage policies
    public class PoliciesController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly RoleManager<ApplicationRole> _roleManager;

        public PoliciesController(ApplicationDbContext context, RoleManager<ApplicationRole> roleManager)
        {
            _context = context;
            _roleManager = roleManager;
        }

        // GET: api/policies/all
        // Returns the list of ALL available system policies (permissions) in the database.
        // Grouped by Category for easier UI rendering.
        [HttpGet("all")]
        public async Task<IActionResult> GetAllPolicies()
        {
            // --- SELF-HEAL ---
            // Ensure all code-defined permissions exist in DB before returning list
            var allPermissions = Permissions.GetAllPermissions();
            bool changesMade = false;
            foreach (var permKey in allPermissions)
            {
                if (!await _context.SystemPolicies.AnyAsync(p => p.PolicyKey == permKey))
                {
                    var parts = permKey.Split('.');
                    string category = parts.Length > 1 ? parts[1] : "General";
                    string name = parts.Length > 2 ? string.Join(" ", parts.Skip(2).ToArray()) : parts.Last();

                    _context.SystemPolicies.Add(new SystemPolicy
                    {
                        PolicyKey = permKey,
                        Category = category,
                        DisplayName = $"{category}: {name}",
                        Description = $"Auto-generated policy for {permKey}"
                    });
                    changesMade = true;
                }
            }

            if (changesMade) await _context.SaveChangesAsync();

            var policies = await _context.SystemPolicies
                .OrderBy(p => p.Category)
                .ThenBy(p => p.DisplayName)
                .ToListAsync();

            // Grouping logic for frontend convenience
            var grouped = policies.GroupBy(p => p.Category)
                .Select(g => new
                {
                    Category = g.Key,
                    Policies = g.Select(p => new
                    {
                        p.Id,
                        p.PolicyKey,
                        p.DisplayName,
                        p.Description
                    })
                });

            return Success(grouped);
        }

        // GET: api/policies/{roleName}
        // Returns the list of policy keys that are GRANTED to this role.
        [HttpGet("{roleName}")]
        public async Task<IActionResult> GetRolePermissions(string roleName)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null) return Failure("Role not found", 404);

            var grantedPolicyIds = await _context.RolePolicies
                .Where(rp => rp.RoleId == role.Id && rp.IsGranted)
                .Select(rp => rp.PolicyId)
                .ToListAsync();

            var grantedPolicyKeys = await _context.SystemPolicies
                .Where(p => grantedPolicyIds.Contains(p.Id))
                .Select(p => p.PolicyKey)
                .ToListAsync();

            return Success(new { Role = roleName, Permissions = grantedPolicyKeys });
        }

        // PUT: api/policies/{roleName}
        // Updates the permissions for the role using the new relational table.
        // If a policy is present in the list, it is GRANTED. If missing, it is REVOKED (deleted or set to false).
        [HttpPut("{roleName}")]
        public async Task<IActionResult> UpdateRolePermissions(string roleName, [FromBody] List<string> newPolicyKeys)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null) return Failure("Role not found", 404);

            newPolicyKeys = newPolicyKeys ?? new List<string>();

            // --- SELF-HEAL ---
            // Ensure all code-defined permissions exist in DB before processing update
            var allPermissions = Permissions.GetAllPermissions();
            bool changesMade = false;
            foreach (var permKey in allPermissions)
            {
                if (!await _context.SystemPolicies.AnyAsync(p => p.PolicyKey == permKey))
                {
                    var parts = permKey.Split('.');
                    string category = parts.Length > 1 ? parts[1] : "General";
                    string name = parts.Length > 2 ? string.Join(" ", parts.Skip(2).ToArray()) : parts.Last();

                    _context.SystemPolicies.Add(new SystemPolicy
                    {
                        PolicyKey = permKey,
                        Category = category,
                        DisplayName = $"{category}: {name}",
                        Description = $"Auto-generated policy for {permKey}"
                    });
                    changesMade = true;
                }
            }

            if (changesMade) await _context.SaveChangesAsync();

            // 1. Resolve Policy Keys to IDs
            var validPolicies = await _context.SystemPolicies
                .Where(p => newPolicyKeys.Contains(p.PolicyKey))
                .ToListAsync();

            var validPolicyIds = validPolicies.Select(p => p.Id).ToHashSet();

            // 2. Fetch Existing Links
            var existingLinks = await _context.RolePolicies
                .Where(rp => rp.RoleId == role.Id)
                .ToListAsync();

            // 3. Update / Insert / Delete Logic
            // Strategy: We want the database state to match the input list.

            // A. policies to GRANT (in input)
            foreach (var policyId in validPolicyIds)
            {
                var existing = existingLinks.FirstOrDefault(rp => rp.PolicyId == policyId);
                if (existing != null)
                {
                    // Already exists, ensure it is granted
                    if (!existing.IsGranted) existing.IsGranted = true;
                }
                else
                {
                    // Does not exist, create new link
                    _context.RolePolicies.Add(new RolePolicy
                    {
                        RoleId = role.Id,
                        PolicyId = policyId,
                        IsGranted = true
                    });
                }
            }

            // B. policies to REVOKE (not in input, but exist in db)
            foreach (var link in existingLinks)
            {
                if (!validPolicyIds.Contains(link.PolicyId))
                {
                    // Soft Delete (IsGranted = false) 
                    // This prevents the seeder from re-adding it on next restart
                    if (link.IsGranted) link.IsGranted = false;
                }
            }

            await _context.SaveChangesAsync();

            return Success(new { Message = $"Permissions updated for role {roleName}", Count = validPolicyIds.Count });
        }
    }
}
