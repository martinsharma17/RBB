using AUTHApi.Data;
using AUTHApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace AUTHApi.Services
{
    public static class KycFormStepSeeder
    {
        public static async Task SeedKycStepsAsync(ApplicationDbContext context)
        {
            var steps = new List<KycFormSteps>
            {
                new KycFormSteps { StepNumber = 1, StepName = "Personal Info", DisplayOrder = 1, IsRequired = true },
                new KycFormSteps { StepNumber = 2, StepName = "Current Address", DisplayOrder = 2, IsRequired = true },
                new KycFormSteps { StepNumber = 3, StepName = "Permanent Address", DisplayOrder = 3, IsRequired = true },
                new KycFormSteps { StepNumber = 4, StepName = "Family Details", DisplayOrder = 4, IsRequired = true },
                new KycFormSteps { StepNumber = 5, StepName = "Bank Account", DisplayOrder = 5, IsRequired = true },
                new KycFormSteps { StepNumber = 6, StepName = "Occupation Info", DisplayOrder = 6, IsRequired = true },
                new KycFormSteps { StepNumber = 7, StepName = "Financial Details", DisplayOrder = 7, IsRequired = true },
                new KycFormSteps { StepNumber = 8, StepName = "Transaction Info", DisplayOrder = 8, IsRequired = true },
                new KycFormSteps { StepNumber = 9, StepName = "Guardian Details", DisplayOrder = 9, IsRequired = false },
                new KycFormSteps { StepNumber = 10, StepName = "AML Compliance", DisplayOrder = 10, IsRequired = true },
                new KycFormSteps { StepNumber = 11, StepName = "Location Map", DisplayOrder = 11, IsRequired = true },
                new KycFormSteps { StepNumber = 12, StepName = "Legal Declarations", DisplayOrder = 12, IsRequired = true },
                new KycFormSteps { StepNumber = 13, StepName = "General Agreement", DisplayOrder = 13, IsRequired = true },
                new KycFormSteps { StepNumber = 14, StepName = "Attachments", DisplayOrder = 14, IsRequired = true }
            };

            foreach (var step in steps)
            {
                var existingStep = await context.KycFormSteps.FindAsync(step.StepNumber);
                if (existingStep == null)
                {
                    await context.KycFormSteps.AddAsync(step);
                }
                else
                {
                    existingStep.StepName = step.StepName;
                    existingStep.DisplayOrder = step.DisplayOrder;
                    existingStep.IsRequired = step.IsRequired;
                    existingStep.IsActive = true;
                    context.KycFormSteps.Update(existingStep);
                }
            }

            // Remove any steps with step number > 14 if they exist
            var extraSteps = await context.KycFormSteps.Where(s => s.StepNumber > 14).ToListAsync();
            if (extraSteps.Any())
            {
                context.KycFormSteps.RemoveRange(extraSteps);
            }

            await context.SaveChangesAsync();
        }
    }
}
