using AUTHApi.Data;
using AUTHApi.Entities;
using AUTHApi.Core.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AUTHApi.Controllers
{
    /// <summary>
    /// Menu Management Controller - Allows SuperAdmin to manage menu items via UI
    /// instead of editing code. Provides CRUD operations for menu items.
    /// </summary>
    [ApiController]
    [Route("api/menu-management")]
    [Authorize(Policy = Permissions.Settings.Sidebar)] // Use granular policy instead of hardcoded role
    public class MenuManagementController : BaseApiController
    {
        private readonly ApplicationDbContext _context;

        public MenuManagementController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all menu items in tree structure
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllMenuItems()
        {
            // Fetch all menu items with their children
            var allItems = await _context.MenuItems
                .Include(m => m.Children)
                .Include(m => m.RequiredPolicy)
                .OrderBy(m => m.Order)
                .AsNoTracking()
                .ToListAsync();

            // Build tree structure (root items only, children are included via navigation)
            var rootItems = allItems.Where(m => m.ParentId == null).ToList();

            return Success(rootItems);
        }

        /// <summary>
        /// Get a single menu item by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMenuItem(int id)
        {
            var menuItem = await _context.MenuItems
                .Include(m => m.RequiredPolicy)
                .Include(m => m.Parent)
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == id);

            if (menuItem == null)
                return Failure("Menu item not found", 404);

            return Success(menuItem);
        }

        /// <summary>
        /// Create a new menu item
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateMenuItem([FromBody] MenuItemDto dto)
        {
            // Validation: Check for duplicate ViewId
            if (await _context.MenuItems.AnyAsync(m => m.ViewId == dto.ViewId))
                return Failure($"Menu item with ViewId '{dto.ViewId}' already exists");

            // Resolve RequiredPolicyId from Permission string
            int? policyId = null;
            if (!string.IsNullOrEmpty(dto.Permission))
            {
                var policy = await _context.SystemPolicies
                    .FirstOrDefaultAsync(p => p.PolicyKey == dto.Permission);
                policyId = policy?.Id;
            }

            // Create new menu item
            var menuItem = new MenuItem
            {
                Title = dto.Title,
                ViewId = dto.ViewId,
                Url = dto.Url,
                Icon = dto.Icon,
                Permission = dto.Permission,
                RequiredPolicyId = policyId,
                ParentId = dto.ParentId,
                Order = dto.Order ?? await GetNextOrderValue(dto.ParentId),
                IsVisible = dto.IsVisible ?? true
            };

            _context.MenuItems.Add(menuItem);
            await _context.SaveChangesAsync();

            return Success(menuItem, "Menu item created successfully");
        }

        /// <summary>
        /// Update an existing menu item
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMenuItem(int id, [FromBody] MenuItemDto dto)
        {
            var menuItem = await _context.MenuItems.FindAsync(id);
            if (menuItem == null)
                return Failure("Menu item not found", 404);

            // Validation: Check for duplicate ViewId (excluding current item)
            if (await _context.MenuItems.AnyAsync(m => m.ViewId == dto.ViewId && m.Id != id))
                return Failure($"Menu item with ViewId '{dto.ViewId}' already exists");

            // Resolve RequiredPolicyId from Permission string
            int? policyId = null;
            if (!string.IsNullOrEmpty(dto.Permission))
            {
                var policy = await _context.SystemPolicies
                    .FirstOrDefaultAsync(p => p.PolicyKey == dto.Permission);
                policyId = policy?.Id;
            }

            // Update properties
            menuItem.Title = dto.Title;
            menuItem.ViewId = dto.ViewId;
            menuItem.Url = dto.Url;
            menuItem.Icon = dto.Icon;
            menuItem.Permission = dto.Permission;
            menuItem.RequiredPolicyId = policyId;
            menuItem.ParentId = dto.ParentId;
            menuItem.Order = dto.Order ?? menuItem.Order;
            menuItem.IsVisible = dto.IsVisible ?? menuItem.IsVisible;

            await _context.SaveChangesAsync();

            return Success(menuItem, "Menu item updated successfully");
        }

        /// <summary>
        /// Delete a menu item (and its children if cascade)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMenuItem(int id)
        {
            var menuItem = await _context.MenuItems
                .Include(m => m.Children)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (menuItem == null)
                return Failure("Menu item not found", 404);

            // Check if it has children
            if (menuItem.Children.Any())
            {
                return Failure("Cannot delete menu item with children. Delete children first or use cascade delete.");
            }

            _context.MenuItems.Remove(menuItem);
            await _context.SaveChangesAsync();

            return Success("Menu item deleted successfully");
        }

        /// <summary>
        /// Batch update menu item order (for drag & drop reordering)
        /// </summary>
        [HttpPut("reorder")]
        public async Task<IActionResult> ReorderMenuItems([FromBody] List<MenuItemOrderDto> orderUpdates)
        {
            foreach (var update in orderUpdates)
            {
                var menuItem = await _context.MenuItems.FindAsync(update.Id);
                if (menuItem != null)
                {
                    menuItem.Order = update.Order;
                }
            }

            await _context.SaveChangesAsync();

            return Success("Menu items reordered successfully");
        }

        /// <summary>
        /// Get list of available icons (from SidebarIcons.tsx)
        /// </summary>
        [HttpGet("icons")]
        public IActionResult GetAvailableIcons()
        {
            // List of icon names that exist in SidebarIcons.tsx
            var icons = new[]
            {
                "DashboardIcon", "UserIcon", "UsersIcon", "RolesIcon", "PolicyIcon",
                "KycIcon", "ChartsIcon", "ProjectIcon", "TaskIcon", "ReportsIcon",
                "AuditIcon", "NotificationsIcon", "SettingsIcon", "SecurityIcon",
                "BackupIcon", "MenuIcon"
            };

            return Success(icons);
        }

        /// <summary>
        /// Get list of available permissions (from SystemPolicies)
        /// </summary>
        [HttpGet("permissions")]
        public async Task<IActionResult> GetAvailablePermissions()
        {
            var permissions = await _context.SystemPolicies
                .Where(p => p.PolicyKey.EndsWith(".Sidebar")) // Only sidebar permissions
                .OrderBy(p => p.Category)
                .Select(p => new
                {
                    p.PolicyKey,
                    p.DisplayName,
                    p.Category
                })
                .ToListAsync();

            return Success(permissions);
        }

        // Helper: Get next order value for a given parent
        private async Task<int> GetNextOrderValue(int? parentId)
        {
            var maxOrder = await _context.MenuItems
                .Where(m => m.ParentId == parentId)
                .MaxAsync(m => (int?)m.Order);

            return (maxOrder ?? 0) + 1;
        }
    }

    #region DTOs

    /// <summary>
    /// DTO for creating/updating menu items
    /// </summary>
    public class MenuItemDto
    {
        public string Title { get; set; } = string.Empty;
        public string ViewId { get; set; } = string.Empty;
        public string? Url { get; set; }
        public string? Icon { get; set; }
        public string? Permission { get; set; }
        public int? ParentId { get; set; }
        public int? Order { get; set; }
        public bool? IsVisible { get; set; }
    }

    /// <summary>
    /// DTO for batch reordering
    /// </summary>
    public class MenuItemOrderDto
    {
        public int Id { get; set; }
        public int Order { get; set; }
    }

    #endregion
}
