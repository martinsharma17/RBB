using System.Text.Json;
using AUTHApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace AUTHApi.Data
{
    public class AddressSeeder
    {
        private readonly ApplicationDbContext _context;

        public AddressSeeder(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task SeedAsync()
        {
            // Only seed if we don't have provinces yet
            if (await _context.Provinces.AnyAsync()) return;

            var filePath = @"d:\1nayacode\UserManagement\branches_details.txt";
            if (!File.Exists(filePath)) return;

            var jsonContent = await File.ReadAllTextAsync(filePath);

            try
            {
                // The structure matches: { provinceList: [ ... ] }
                var data = JsonSerializer.Deserialize<RootObject>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (data?.ProvinceList == null) return;

                var provinces = new List<Province>();
                var districts = new List<District>();
                var municipalities = new List<Municipality>();

                foreach (var pDto in data.ProvinceList)
                {
                    provinces.Add(new Province
                    {
                        Id = pDto.Id,
                        Name = pDto.Name
                    });

                    if (pDto.DistrictList != null)
                    {
                        foreach (var dDto in pDto.DistrictList)
                        {
                            districts.Add(new District
                            {
                                Id = dDto.Id,
                                Name = dDto.Name,
                                ProvinceId = pDto.Id
                            });

                            if (dDto.MunicipalityList != null)
                            {
                                foreach (var mDto in dDto.MunicipalityList)
                                {
                                    municipalities.Add(new Municipality
                                    {
                                        Id = mDto.Id,
                                        Name = mDto.Name,
                                        DistrictId = dDto.Id
                                    });
                                }
                            }
                        }
                    }
                }

                await _context.Provinces.AddRangeAsync(provinces);
                await _context.Districts.AddRangeAsync(districts);
                await _context.Municipalities.AddRangeAsync(municipalities);

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log error safely
                Console.WriteLine($"Error seeding addresses: {ex.Message}");
            }
        }

        // Helper classes for JSON Deserialization
        private class RootObject
        {
            public List<ProvinceDto> ProvinceList { get; set; }
        }

        private class ProvinceDto
        {
            public int Id { get; set; }
            public string Name { get; set; }
            public List<DistrictDto> DistrictList { get; set; }
        }

        private class DistrictDto
        {
            public int Id { get; set; }
            public string Name { get; set; }
            public List<MunicipalityDto> MunicipalityList { get; set; }
        }

        private class MunicipalityDto
        {
            public int Id { get; set; }
            public string Name { get; set; }
        }
    }
}
