using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AUTHApi.Entities;

namespace AUTHApi.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public DbSet<MenuItem> MenuItems { get; set; }
        public DbSet<Branch> Branches { get; set; }

        // Core KYC Session Tables
        public DbSet<KycFormSession> KycFormSessions { get; set; }
        public DbSet<KycOtpVerification> KycOtpVerifications { get; set; }
        public DbSet<KycFormSteps> KycFormSteps { get; set; }
        public DbSet<KycStepCompletion> KycStepCompletions { get; set; }

        // KYC Data Tables
        public DbSet<KycPersonalInfo> KycPersonalInfos { get; set; }
        public DbSet<KycCurrentAddress> KycCurrentAddresses { get; set; }
        public DbSet<KycPermanentAddress> KycPermanentAddresses { get; set; }
        public DbSet<KycFamily> KycFamilies { get; set; }
        public DbSet<KycBank> KycBanks { get; set; }
        public DbSet<KycOccupation> KycOccupations { get; set; }
        public DbSet<KycFinancialDetails> KycFinancialDetails { get; set; }
        public DbSet<KycTransactionInfo> KycTransactionInfos { get; set; }
        public DbSet<KycGuardian> KycGuardians { get; set; }
        public DbSet<KycAmlCompliance> KycAmlCompliances { get; set; }
        public DbSet<KycAttachment> KycAttachments { get; set; }
        public DbSet<KycLocationMap> KycLocationMaps { get; set; }
        public DbSet<KycDeclarations> KycDeclarations { get; set; }
        public DbSet<KycAgreement> KycAgreements { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure Unique Constraints
            builder.Entity<KycFormSession>()
                .HasIndex(s => s.SessionToken)
                .IsUnique();

            builder.Entity<KycFormSession>()
                .HasIndex(s => new { s.Email, s.SessionToken })
                .IsUnique();

            builder.Entity<KycStepCompletion>()
                .HasIndex(sc => new { sc.SessionId, sc.StepNumber })
                .IsUnique();

            // Configure Relationships and Cascade Behaviors
            builder.Entity<KycFormSession>()
                .HasMany(s => s.StepCompletions)
                .WithOne(sc => sc.Session)
                .HasForeignKey(sc => sc.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<KycFormSession>()
                .HasMany(s => s.OtpVerifications)
                .WithOne(o => o.Session)
                .HasForeignKey(o => o.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Setup 1:1 or 1:Many relationships based on PersonalInfo
            builder.Entity<KycPersonalInfo>()
                .HasOne(p => p.Session)
                .WithOne(s => s.PersonalInfo)
                .HasForeignKey<KycFormSession>(s => s.KycPersonalInfoId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure Section to PersonalInfo links
            var sections = new[]
            {
                typeof(KycCurrentAddress), typeof(KycPermanentAddress), typeof(KycFamily),
                typeof(KycBank), typeof(KycOccupation), typeof(KycFinancialDetails),
                typeof(KycTransactionInfo), typeof(KycGuardian), typeof(KycAmlCompliance),
                typeof(KycAttachment), typeof(KycLocationMap), typeof(KycDeclarations),
                typeof(KycAgreement)
            };

            foreach (var type in sections)
            {
                builder.Entity(type)
                    .HasOne("Session")
                    .WithMany()
                    .HasForeignKey("SessionId")
                    .OnDelete(DeleteBehavior.Cascade);

                builder.Entity(type)
                    .HasOne("PersonalInfo")
                    .WithMany()
                    .HasForeignKey("KycPersonalInfoId")
                    .OnDelete(DeleteBehavior.NoAction);
            }
        }
    }
}
