using AUTHApi.Data;
using AUTHApi.Entities;
using AUTHApi.Core.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
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

        // ============ PROVINCE ENDPOINTS ============
        [HttpGet("provinces")]
        [AllowAnonymous] // Keep public for KYC form
        public async Task<IActionResult> GetProvinces()
        {
            var provinces = await _context.Provinces
                .Select(p => new { p.Id, p.Name })
                .ToListAsync();
            return Ok(provinces);
        }

        [HttpPost("provinces")]
        [Authorize(Policy = Permissions.Address.Create)]
        public async Task<IActionResult> CreateProvince([FromBody] Province province)
        {
            if (string.IsNullOrWhiteSpace(province.Name))
                return BadRequest("Province name is required.");

            // Manual ID generation for None generation option
            int nextId = await _context.Provinces.AnyAsync() ? await _context.Provinces.MaxAsync(p => p.Id) + 1 : 1;
            province.Id = nextId;

            _context.Provinces.Add(province);
            await _context.SaveChangesAsync();
            return Ok(province);
        }

        [HttpPut("provinces/{id}")]
        [Authorize(Policy = Permissions.Address.Edit)]
        public async Task<IActionResult> UpdateProvince(int id, [FromBody] Province province)
        {
            var existing = await _context.Provinces.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Name = province.Name;
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("provinces/{id}")]
        [Authorize(Policy = Permissions.Address.Delete)]
        public async Task<IActionResult> DeleteProvince(int id)
        {
            var province = await _context.Provinces
                .Include(p => p.Districts)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (province == null) return NotFound();

            // Prevent deletion if has districts
            if (province.Districts.Any())
                return BadRequest("Cannot delete province with existing districts.");

            _context.Provinces.Remove(province);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // ============ DISTRICT ENDPOINTS ============
        [HttpGet("districts/{provinceId}")]
        [AllowAnonymous] // Keep public for KYC form
        public async Task<IActionResult> GetDistricts(int provinceId)
        {
            var districts = await _context.Districts
                .Where(d => d.ProvinceId == provinceId)
                .Select(d => new { d.Id, d.Name })
                .ToListAsync();
            return Ok(districts);
        }

        [HttpGet("districts")]
        [Authorize(Policy = Permissions.Address.View)]
        public async Task<IActionResult> GetAllDistricts()
        {
            var districts = await _context.Districts
                .Include(d => d.Province)
                .Select(d => new
                {
                    d.Id,
                    d.Name,
                    d.ProvinceId,
                    ProvinceName = d.Province!.Name
                })
                .ToListAsync();
            return Ok(districts);
        }

        [HttpPost("districts")]
        [Authorize(Policy = Permissions.Address.Create)]
        public async Task<IActionResult> CreateDistrict([FromBody] District district)
        {
            if (string.IsNullOrWhiteSpace(district.Name))
                return BadRequest("District name is required.");

            if (district.ProvinceId <= 0)
                return BadRequest("Invalid Province selected.");

            // Manual ID generation for None generation option
            int nextId = await _context.Districts.AnyAsync() ? await _context.Districts.MaxAsync(d => d.Id) + 1 : 1;
            district.Id = nextId;

            _context.Districts.Add(district);
            await _context.SaveChangesAsync();
            return Ok(district);
        }

        [HttpPut("districts/{id}")]
        [Authorize(Policy = Permissions.Address.Edit)]
        public async Task<IActionResult> UpdateDistrict(int id, [FromBody] District district)
        {
            var existing = await _context.Districts.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Name = district.Name;
            existing.ProvinceId = district.ProvinceId;
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("districts/{id}")]
        [Authorize(Policy = Permissions.Address.Delete)]
        public async Task<IActionResult> DeleteDistrict(int id)
        {
            var district = await _context.Districts
                .Include(d => d.Municipalities)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (district == null) return NotFound();

            // Prevent deletion if has municipalities
            if (district.Municipalities.Any())
                return BadRequest("Cannot delete district with existing municipalities.");

            _context.Districts.Remove(district);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // ============ MUNICIPALITY ENDPOINTS ============
        [HttpGet("municipalities/{districtId}")]
        [AllowAnonymous] // Keep public for KYC form
        public async Task<IActionResult> GetMunicipalities(int districtId)
        {
            var municipalities = await _context.Municipalities
                .Where(m => m.DistrictId == districtId)
                .Select(m => new { m.Id, m.Name })
                .ToListAsync();
            return Ok(municipalities);
        }

        [HttpGet("municipalities")]
        [Authorize(Policy = Permissions.Address.View)]
        public async Task<IActionResult> GetAllMunicipalities()
        {
            var municipalities = await _context.Municipalities
                .Include(m => m.District)
                .ThenInclude(d => d!.Province)
                .Select(m => new
                {
                    m.Id,
                    m.Name,
                    m.DistrictId,
                    DistrictName = m.District!.Name,
                    ProvinceId = m.District.ProvinceId,
                    ProvinceName = m.District.Province!.Name
                })
                .ToListAsync();
            return Ok(municipalities);
        }

        [HttpPost("municipalities")]
        [Authorize(Policy = Permissions.Address.Create)]
        public async Task<IActionResult> CreateMunicipality([FromBody] Municipality municipality)
        {
            if (string.IsNullOrWhiteSpace(municipality.Name))
                return BadRequest("Municipality name is required.");

            if (municipality.DistrictId <= 0)
                return BadRequest("Invalid District selected.");

            // Manual ID generation for None generation option
            int nextId = await _context.Municipalities.AnyAsync()
                ? await _context.Municipalities.MaxAsync(m => m.Id) + 1
                : 1;
            municipality.Id = nextId;

            _context.Municipalities.Add(municipality);
            await _context.SaveChangesAsync();
            return Ok(municipality);
        }

        [HttpPut("municipalities/{id}")]
        [Authorize(Policy = Permissions.Address.Edit)]
        public async Task<IActionResult> UpdateMunicipality(int id, [FromBody] Municipality municipality)
        {
            var existing = await _context.Municipalities.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Name = municipality.Name;
            existing.DistrictId = municipality.DistrictId;
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("municipalities/{id}")]
        [Authorize(Policy = Permissions.Address.Delete)]
        public async Task<IActionResult> DeleteMunicipality(int id)
        {
            var municipality = await _context.Municipalities.FindAsync(id);
            if (municipality == null) return NotFound();

            _context.Municipalities.Remove(municipality);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
