using AUTHApi.Data;
using AUTHApi.Entities;
using Microsoft.EntityFrameworkCore;
using System; // Added for DateTime.UtcNow
using System.Threading.Tasks;

namespace AUTHApi.Data
{
    public static class ProjectSettingsSeeder
    {
        public static async Task SeedProjectSettingsAsync(ApplicationDbContext context)
        {
            if (!await context.ProjectSettings.AnyAsync())
            {
                context.ProjectSettings.Add(new ProjectSetting
                {
                    ApplicationName = "Identity System",
                    UpdatedAt = DateTime.UtcNow
                });

                await context.SaveChangesAsync();
            }
        }
    }
}
