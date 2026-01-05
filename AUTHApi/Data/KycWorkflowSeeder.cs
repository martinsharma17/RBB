using AUTHApi.Data;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AUTHApi.Data
{
    public static class KycWorkflowSeeder
    {
        public static async Task SeedWorkflowConfigAsync(ApplicationDbContext context,
            RoleManager<IdentityRole> roleManager)
        {
            // Clear existing to apply new structured schema
            context.KycApprovalSteps.RemoveRange(context.KycApprovalSteps);
            context.KycApprovalConfigs.RemoveRange(context.KycApprovalConfigs);
            await context.SaveChangesAsync();

            // Define the default chains (Starting Role Name -> List of Approval Role Names)
            // Order 0: User -> Maker -> Checker -> RBBSec
            // Order 1: Maker -> Checker -> RBBSec
            // Order 2: Checker -> RBBSec
            // Order 3: RBBSec -> (Direct Approval)
            var configs = new List<(string StartRole, List<string> Chain)>
            {
                ("User", new List<string> { "Maker", "Checker", "RBBSec" }),
                ("Maker", new List<string> { "Checker", "RBBSec" }),
                ("Checker", new List<string> { "RBBSec" }),
                ("RBBSec", new List<string>()) // Empty chain means direct approve logic or finalized
            };

            foreach (var cfg in configs)
            {
                var startRole = await roleManager.FindByNameAsync(cfg.StartRole);
                if (startRole == null)
                {
                    Console.WriteLine($"[SKIPPED] Start role '{cfg.StartRole}' not found.");
                    continue;
                }

                var config = new KycApprovalConfig
                {
                    RoleId = startRole.Id,
                    CreatedAt = DateTime.UtcNow
                };
                context.KycApprovalConfigs.Add(config);
                await context.SaveChangesAsync(); // Get ID

                int order = 0;
                foreach (var chainRoleName in cfg.Chain)
                {
                    var chainRole = await roleManager.FindByNameAsync(chainRoleName);
                    if (chainRole != null)
                    {
                        context.KycApprovalSteps.Add(new KycApprovalStep
                        {
                            ConfigId = config.Id,
                            RoleId = chainRole.Id,
                            StepOrder = order++,
                            CreatedAt = DateTime.UtcNow
                        });
                        Console.WriteLine($"   -> Adding Step {order}: {chainRoleName}");
                    }
                    else
                    {
                        Console.WriteLine($"   -> [SKIPPED] Chain role '{chainRoleName}' not found.");
                    }
                }
            }

            await context.SaveChangesAsync();
            Console.WriteLine("KYC WORKFLOW SEEDING COMPLETE.");
        }
    }
}
