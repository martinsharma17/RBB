using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AUTHApi.Entities;

namespace AUTHApi.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
    {
        public DbSet<MenuItem> MenuItems { get; set; }
        public DbSet<Branch> Branches { get; set; }
        public DbSet<ProjectSetting> ProjectSettings { get; set; }

        // --- Address Lookup Tables ---
        public DbSet<Province> Provinces { get; set; }
        public DbSet<District> Districts { get; set; }
        public DbSet<Municipality> Municipalities { get; set; }

        //---Occupation Table---
        public DbSet<Occupation> Occupations { get; set; }

        // --- Core KYC Session Tables ---
        public DbSet<KycFormSession> KycFormSessions { get; set; }
        public DbSet<KycOtpVerification> KycOtpVerifications { get; set; }
        public DbSet<KycFormSteps> KycFormSteps { get; set; }
        public DbSet<KycStepCompletion> KycStepCompletions { get; set; }

        // --- New Consolidated KYC Tables ---
        public DbSet<KycDetail> KycDetails { get; set; }
        public DbSet<KycDocument> KycDocuments { get; set; }

        // --- KYC Workflow Tables ---
        public DbSet<KycApprovalConfig> KycApprovalConfigs { get; set; }
        public DbSet<KycApprovalStep> KycApprovalSteps { get; set; }
        public DbSet<KycWorkflowMaster> KycWorkflowMasters { get; set; }
        public DbSet<KycApprovalLog> KycApprovalLogs { get; set; }

        // --- Permission & Policy System ---
        public DbSet<SystemPolicy> SystemPolicies { get; set; }
        public DbSet<RolePolicy> RolePolicies { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure Unique Constraints for Sessions
            builder.Entity<KycFormSession>().HasIndex(s => s.SessionToken).IsUnique();
            builder.Entity<KycFormSession>().HasIndex(s => new { s.Email, s.SessionToken }).IsUnique();
            builder.Entity<KycStepCompletion>().HasIndex(sc => new { sc.SessionId, sc.StepNumber }).IsUnique();

            // Configure Session Relationships
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

            // Link Session <-> KycDetail (1:1 relationship)
            builder.Entity<KycFormSession>()
                .HasOne(s => s.KycDetail)
                .WithMany() // KycDetail doesn't necessarily need a collection of sessions usually
                .HasForeignKey(s => s.KycDetailId)
                .OnDelete(DeleteBehavior.SetNull);

            // Configure KycDetail Relationships
            builder.Entity<KycDetail>()
                .HasMany(k => k.Documents)
                .WithOne(d => d.KycDetail)
                .HasForeignKey(d => d.KycDetailId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Permission System
            builder.Entity<SystemPolicy>().HasIndex(p => p.PolicyKey).IsUnique();
            builder.Entity<RolePolicy>().HasIndex(rp => new { rp.RoleId, rp.PolicyId }).IsUnique();

            // Configure KYC Workflow
            builder.Entity<KycApprovalConfig>()
                .HasMany(c => c.Steps)
                .WithOne(s => s.Config)
                .HasForeignKey(s => s.ConfigId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<KycApprovalConfig>().HasIndex(c => c.RoleId).IsUnique();
            builder.Entity<KycWorkflowMaster>()
                .HasOne(m => m.KycSession)
                .WithMany()
                .HasForeignKey(m => m.KycSessionId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<KycApprovalLog>()
                .HasOne(l => l.KycWorkflow)
                .WithMany()
                .HasForeignKey(l => l.KycWorkflowId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
