using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AUTHApi.Entities;
using AUTHApi.Data;

namespace AUTHApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OccupationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OccupationController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult GetAll()
        {
            var list = _context.Occupations.ToList();
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
                _context.SaveChanges();
                list = _context.Occupations.ToList();
            }

            return Ok(list);
        }

        [HttpPost]
        // [Authorize(Roles = "SuperAdmin")]
        public IActionResult Create([FromBody] Occupation occupation)
        {
            _context.Occupations.Add(occupation);
            _context.SaveChanges();
            return Ok(occupation);
        }

        [HttpPut("{id}")]
        // [Authorize(Roles = "SuperAdmin")]
        public IActionResult Update(int id, [FromBody] Occupation occupation)
        {
            var occ = _context.Occupations.Find(id);
            if (occ == null) return NotFound();
            occ.Name = occupation.Name;
            _context.SaveChanges();
            return Ok(occ);
        }

        [HttpDelete("{id}")]
        // [Authorize(Roles = "SuperAdmin")]
        public IActionResult Delete(int id)
        {
            var occ = _context.Occupations.Find(id);
            if (occ == null) return NotFound();
            _context.Occupations.Remove(occ);
            _context.SaveChanges();
            return Ok();
        }
    }
}