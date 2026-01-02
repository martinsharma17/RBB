using AUTHApi.Data;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AUTHApi.Data
{
    public static class KycWorkflowSeeder
    {
        public static async Task SeedWorkflowConfigAsync(ApplicationDbContext context, RoleManager<IdentityRole> roleManager)
        {
            // Define the default chains
            var configs = new List<(string StartRole, List<string> Chain)>
            {
                ("Maker", new List<string> { "Checker", "RBBSec" }),
                ("User", new List<string> { "Maker", "Checker", "RBBSec" }),
                ("Admin", new List<string> { "SuperAdmin" })
            };

            foreach (var cfg in configs)
            {
                var role = await roleManager.FindByNameAsync(cfg.StartRole);
                if (role == null) continue;

                var existing = await context.KycApprovalConfigs.FirstOrDefaultAsync(c => c.RoleId == role.Id);
                if (existing == null)
                {
                    context.KycApprovalConfigs.Add(new KycApprovalConfig
                    {
                        RoleId = role.Id,
                        ApprovalChain = JsonSerializer.Serialize(cfg.Chain),
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            await context.SaveChangesAsync();
        }
    }
}
