using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AUTHApi.Entities;
using AUTHApi.Data;
using AUTHApi.Core.Security;
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
        [AllowAnonymous] // Keep public for KYC form
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

        [HttpPost]
        [Authorize(Policy = Permissions.Country.Create)]
        public async Task<IActionResult> Create([FromBody] Country country)
        {
            if (string.IsNullOrWhiteSpace(country.Name))
                return BadRequest("Country name is required.");

            _context.Countries.Add(country);
            await _context.SaveChangesAsync();
            return Ok(country);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Permissions.Country.Edit)]
        public async Task<IActionResult> Update(int id, [FromBody] Country country)
        {
            var existing = await _context.Countries.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Name = country.Name;
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Permissions.Country.Delete)]
        public async Task<IActionResult> Delete(int id)
        {
            var country = await _context.Countries.FindAsync(id);
            if (country == null) return NotFound();

            _context.Countries.Remove(country);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
