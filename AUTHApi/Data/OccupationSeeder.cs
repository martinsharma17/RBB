using AUTHApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace AUTHApi.Data
{
    public class OccupationSeeder
    {
        private readonly ApplicationDbContext _context;

        public OccupationSeeder(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task SeedAsync()
        {
            Console.WriteLine("[OccupationSeeder] Checking for existing occupations...");
            // Only seed if we don't have occupations yet
            var count = await _context.Occupations.CountAsync();
            if (count > 0)
            {
                Console.WriteLine($"[OccupationSeeder] Found {count} occupations. Skipping seeding.");
                return;
            }

            Console.WriteLine("[OccupationSeeder] No occupations found. Seeding default list...");
            var occupations = new List<Occupation>
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

            await _context.Occupations.AddRangeAsync(occupations);
            await _context.SaveChangesAsync();
          
        }
    }
}
