using AUTHApi.Entities;
using AUTHApi.Data;
using Microsoft.EntityFrameworkCore;

namespace AUTHApi.Data
{
    public class CountrySeeder
    {
        private readonly ApplicationDbContext _context;

        public CountrySeeder(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task SeedAsync()
        {
            if (await _context.Countries.AnyAsync()) return;

            var countries = new List<Country>
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
                new Country { Name = "Sri Lanka" },
                new Country { Name = "Pakistan" },
                new Country { Name = "Bangladesh" },
                new Country { Name = "Bhutan" },
                new Country { Name = "Maldives" },
                new Country { Name = "Others" }
            };

            await _context.Countries.AddRangeAsync(countries);
            await _context.SaveChangesAsync();
        }
    }
}
