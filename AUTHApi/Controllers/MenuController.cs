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
    public class MenuController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MenuController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets the full menu structure.
        /// The frontend is responsible for filtering based on permissions.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMenu()
        {
            // Fetch all items, ordered by their 'Order' field
            var allItems = await _context.MenuItems
                .Include(m => m.Children)
                .OrderBy(m => m.Order)
                .ToListAsync();

            var rootItems = allItems.Where(m => m.ParentId == null).OrderBy(m => m.Order).ToList();
            
            // Helper to recursively sort children
            void SortChildren(MenuItem item)
            {
                if (item.Children != null)
                {
                    item.Children = item.Children.OrderBy(c => c.Order).ToList();
                    foreach (var child in item.Children)
                    {
                        SortChildren(child);
                    }
                }
            }

            foreach (var item in rootItems)
            {
                SortChildren(item);
            }

            return Ok(rootItems);
        }
    }
}
