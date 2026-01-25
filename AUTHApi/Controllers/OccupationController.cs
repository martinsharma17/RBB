using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using AUTHApi.Entities;
using AUTHApi.Data;
using AUTHApi.Core.Security;

namespace AUTHApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OccupationController : BaseApiController
    {
        private readonly ApplicationDbContext _context;

        public OccupationController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = Permissions.Occupation.View)]
        public async Task<IActionResult> GetAll()
        {
            var list = await _context.Occupations.ToListAsync();
            if (!list.Any())
            {
                // Emergency seeding if startup seeder missed it
                var defaults = new List<Occupation>
                {
                    new Occupation { Name = "Salaried" },
                    new Occupation { Name = "Self Employed" },
                    new Occupation { Name = "Student" },
                    new Occupation { Name = "Retired" },
                    new Occupation { Name = "Housewife" },
                    new Occupation { Name = "Business" },
                    new Occupation { Name = "Agriculture" },
                    new Occupation { Name = "Others" }
                };
                _context.Occupations.AddRange(defaults);
                await _context.SaveChangesAsync();
                list = await _context.Occupations.ToListAsync();
            }

            return Ok(list);
        }

        [HttpPost]
        [Authorize(Policy = Permissions.Occupation.Create)]
        public async Task<IActionResult> Create([FromBody] Occupation occupation)
        {
            if (string.IsNullOrWhiteSpace(occupation.Name))
                return BadRequest("Occupation name is required.");

            _context.Occupations.Add(occupation);
            await _context.SaveChangesAsync();
            return Ok(occupation);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Permissions.Occupation.Edit)]
        public async Task<IActionResult> Update(int id, [FromBody] Occupation occupation)
        {
            var occ = await _context.Occupations.FindAsync(id);
            if (occ == null) return NotFound();

            occ.Name = occupation.Name;
            await _context.SaveChangesAsync();
            return Ok(occ);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Permissions.Occupation.Delete)]
        public async Task<IActionResult> Delete(int id)
        {
            var occ = await _context.Occupations.FindAsync(id);
            if (occ == null) return NotFound();

            _context.Occupations.Remove(occ);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
