using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    /// <summary>
    /// The main KYC form entity that tracks the overall status and progress of a user's KYC submission.
    /// Acts as the central hub linking all sectioned tables.
    /// </summary>
    public class KycForm
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }

        public int? BranchId { get; set; }

        [ForeignKey("BranchId")]
        public virtual Branch? Branch { get; set; }

        public string? MakerId { get; set; }

        [ForeignKey("MakerId")]
        public virtual ApplicationUser? Maker { get; set; }

        public string? CheckerId { get; set; }

        [ForeignKey("CheckerId")]
        public virtual ApplicationUser? Checker { get; set; }

        /// <summary>
        /// Current workflow status: Draft, VerifiedByMaker, ApprovedByChecker, Rejected.
        /// </summary>
        [Required]
        public KycStatus Status { get; set; } = KycStatus.Draft;

        /// <summary>
        /// Tracks which step the user is currently on (1-9).
        /// </summary>
        public int CurrentStep { get; set; } = 1;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties for Sections
        public virtual KycPersonalInfo? PersonalInfo { get; set; }
        public virtual KycAddress? Address { get; set; }
        public virtual KycFamily? Family { get; set; }
        public virtual KycBank? Bank { get; set; }
        public virtual KycOccupation? Occupation { get; set; }
        public virtual KycGuardian? Guardian { get; set; }
        public virtual KycLegal? Legal { get; set; }
        public virtual KycInvestment? Investment { get; set; }
        public virtual ICollection<KycAttachment> Attachments { get; set; } = new List<KycAttachment>();
    }

    public enum KycStatus
    {
        Draft,
        VerifiedByMaker,
        ApprovedByChecker,
        Rejected
    }
}
