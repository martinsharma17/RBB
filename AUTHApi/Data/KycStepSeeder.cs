using AUTHApi.Entities;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AUTHApi.Data
{
    public static class KycStepSeeder
    {
        public static async Task SeedStepsAsync(ApplicationDbContext context)
        {
            if (await context.KycFormSteps.AnyAsync()) return;

            var steps = new List<KycFormSteps>
            {
                new KycFormSteps
                {
                    StepNumber = 1, StepName = "Personal Information", StepNameNepali = "व्यक्तिगत विवरण",
                    TableName = "KycPersonalInfo", IsRequired = true, DisplayOrder = 1
                },
                new KycFormSteps
                {
                    StepNumber = 2, StepName = "Current Address", StepNameNepali = "हालको ठेगाना",
                    TableName = "KycCurrentAddress", IsRequired = true, DisplayOrder = 2
                },
                new KycFormSteps
                {
                    StepNumber = 3, StepName = "Permanent Address", StepNameNepali = "स्थायी ठेगाना",
                    TableName = "KycPermanentAddress", IsRequired = true, DisplayOrder = 3
                },
                new KycFormSteps
                {
                    StepNumber = 4, StepName = "Family Members", StepNameNepali = "परिवारका सदस्यहरू",
                    TableName = "KycFamily", IsRequired = true, DisplayOrder = 4
                },
                new KycFormSteps
                {
                    StepNumber = 5, StepName = "Bank Account", StepNameNepali = "बैंक खाता", TableName = "KycBank",
                    IsRequired = true, DisplayOrder = 5
                },
                new KycFormSteps
                {
                    StepNumber = 6, StepName = "Occupation Details", StepNameNepali = "पेशागत विवरण",
                    TableName = "KycOccupation", IsRequired = true, DisplayOrder = 6
                },
                new KycFormSteps
                {
                    StepNumber = 7, StepName = "Financial Details", StepNameNepali = "आर्थिक विवरण",
                    TableName = "KycFinancialDetails", IsRequired = true, DisplayOrder = 7
                },
                new KycFormSteps
                {
                    StepNumber = 8, StepName = "Transaction Information", StepNameNepali = "कारोबार विवरण",
                    TableName = "KycTransactionInfo", IsRequired = true, DisplayOrder = 8
                },
                new KycFormSteps
                {
                    StepNumber = 9, StepName = "Guardian Details", StepNameNepali = "संरक्षकको विवरण",
                    TableName = "KycGuardian", IsRequired = false, DisplayOrder = 9
                },
                new KycFormSteps
                {
                    StepNumber = 10, StepName = "AML Compliance", StepNameNepali = "सम्पत्ति शुद्धिकरण",
                    TableName = "KycAmlCompliance", IsRequired = true, DisplayOrder = 10
                },
                new KycFormSteps
                {
                    StepNumber = 11, StepName = "Photo & Documents", StepNameNepali = "फोटो र कागजात",
                    TableName = "KycAttachment", IsRequired = true, DisplayOrder = 11
                },
                new KycFormSteps
                {
                    StepNumber = 12, StepName = "Location Map", StepNameNepali = "स्थान नक्सा",
                    TableName = "KycLocationMap", IsRequired = true, DisplayOrder = 12
                },
                new KycFormSteps
                {
                    StepNumber = 13, StepName = "Declarations", StepNameNepali = "घोषणा", TableName = "KycDeclarations",
                    IsRequired = true, DisplayOrder = 13
                },
                new KycFormSteps
                {
                    StepNumber = 14, StepName = "Agreement", StepNameNepali = "सम्झौता", TableName = "KycAgreement",
                    IsRequired = true, DisplayOrder = 14
                }
            };

            await context.KycFormSteps.AddRangeAsync(steps);
            await context.SaveChangesAsync();
        }
    }
}
