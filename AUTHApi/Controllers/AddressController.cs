using AUTHApi.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AUTHApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AddressController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AddressController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("provinces")]
        public async Task<IActionResult> GetProvinces()
        {
            var provinces = await _context.Provinces
                .Select(p => new { p.Id, p.Name })
                .ToListAsync();
            return Ok(provinces);
        }

        [HttpGet("districts/{provinceId}")]
        public async Task<IActionResult> GetDistricts(int provinceId)
        {
            var districts = await _context.Districts
                .Where(d => d.ProvinceId == provinceId)
                .Select(d => new { d.Id, d.Name })
                .ToListAsync();
            return Ok(districts);
        }

        [HttpGet("municipalities/{districtId}")]
        public async Task<IActionResult> GetMunicipalities(int districtId)
        {
            var municipalities = await _context.Municipalities
                .Where(m => m.DistrictId == districtId)
                .Select(m => new { m.Id, m.Name })
                .ToListAsync();
            return Ok(municipalities);
        }
    }
}
