using AUTHApi.Data;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using System;
using System.Linq;

namespace AUTHApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require login to see menu
    public class MenuController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public MenuController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        /// <summary>
        /// Gets the dynamic sidebar menu structure for the current user.
        /// Filters menu items based on the user's role and the database-driven 'RolePolicy' table.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetSidebar()
        {
            // 1. Get Current User & Roles
            var userId = _userManager.GetUserId(User);
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return Unauthorized("User not found.");

            var roles = await _userManager.GetRolesAsync(user);
            bool isSuperAdmin = roles.Contains("SuperAdmin");

            // 2. Resolve Effective Permissions (Policies)
            // If SuperAdmin, they get everything.
            // Otherwise, we look up which policies are granted to their roles in the RolePolicy table.
            HashSet<int> grantedPolicyIds = new HashSet<int>();

            if (!isSuperAdmin)
            {
                // Find all Role IDs for the user's role names
                var roleIds = await _context.Roles
                    .Where(r => roles.Contains(r.Name))
                    .Select(r => r.Id)
                    .ToListAsync();

                // Fetch all granted policies for these roles
                grantedPolicyIds = _context.RolePolicies
                     .Where(rp => roleIds.Contains(rp.RoleId) && rp.IsGranted)
                     .Select(rp => rp.PolicyId).ToHashSet();
            }

            // 3. Fetch All Menu Items (Ordered)
            // We fetch everything first to handle the tree structure in memory, 
            // as EF Core recursive filtering is complex and inefficient.
            var allItems = await _context.MenuItems
                .Include(m => m.Children) // Need children to build tree
                .OrderBy(m => m.Order)
                .AsNoTracking()
                .ToListAsync();

            // 4. Filter & Build Tree
            // A menu item is visible IF:
            //   a) It has NO required policy (public/default)
            //   b) User is SuperAdmin (sees everything)
            //   c) The user's granted policies include the item's RequiredPolicyId

            bool IsVisible(MenuItem item)
            {
                if (!item.IsVisible) return false; // Hard 'Visible' toggle in DB
                if (item.RequiredPolicyId == null) return true; // No restriction
                if (isSuperAdmin) return true; // God mode
                return grantedPolicyIds.Contains(item.RequiredPolicyId.Value);
            }

            // Filter recursive function
            List<MenuItem> FilterNodes(IEnumerable<MenuItem> nodes)
            {
                var filtered = new List<MenuItem>();
                foreach (var node in nodes)
                {
                    // Check if parent itself is visible
                    if (IsVisible(node))
                    {
                        // Recursively filter children
                        node.Children = FilterNodes(node.Children);

                        // Optional: Hide parent if all children are hidden? 
                        // For now, we show parent if it's authorized, even if empty.

                        filtered.Add(node);
                    }
                }

                return filtered;
            }

            // Start filtering from root nodes (ParentId == null)
            var rootNodes = allItems.Where(m => m.ParentId == null).OrderBy(m => m.Order).ToList();
            var finalMenu = FilterNodes(rootNodes);

            return Success(finalMenu);
        }
    }
}
