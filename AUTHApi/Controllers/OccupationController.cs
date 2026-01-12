// AUTHApi/Controllers/OccupationController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AUTHApi.Entities;
using AUTHApi.Data;

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
    public IActionResult GetAll() => Ok(_context.Occupations.ToList());

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