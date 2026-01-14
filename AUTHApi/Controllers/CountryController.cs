using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AUTHApi.Entities;
using AUTHApi.Data;
using Microsoft.EntityFrameworkCore;

namespace AUTHApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CountryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CountryController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.Countries.OrderBy(c => c.Name).ToListAsync();
            
            if (!list.Any())
            {
                // Emergency seeding if startup seeder missed it
                var defaults = new List<Country>
                {
                    new Country { Name = "Nepal" },
                    new Country { Name = "India" },
                    new Country { Name = "China" },
                    new Country { Name = "United States" },
                    new Country { Name = "United Kingdom" },
                    new Country { Name = "Australia" },
                    new Country { Name = "Canada" },
                    new Country { Name = "Japan" },
                    new Country { Name = "South Korea" },
                    new Country { Name = "Others" }
                };
                _context.Countries.AddRange(defaults);
                await _context.SaveChangesAsync();
                list = await _context.Countries.OrderBy(c => c.Name).ToListAsync();
            }
            
            return Ok(list);
        }
    }
}
