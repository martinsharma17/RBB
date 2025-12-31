using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycFormSession
    {
        [Key] public int Id { get; set; }

        [Required] public Guid SessionToken { get; set; } = Guid.NewGuid();

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        public string? UserId { get; set; }
        [ForeignKey("UserId")] public virtual ApplicationUser? User { get; set; }

        public bool EmailVerified { get; set; } = false;
        public DateTime? EmailVerifiedDate { get; set; }

        [MaxLength(20)] public string? MobileNo { get; set; }
        public bool MobileVerified { get; set; } = false;
        public DateTime? MobileVerifiedDate { get; set; }

        public int CurrentStep { get; set; } = 1;
        public int LastSavedStep { get; set; } = 0;
        public DateTime LastActivityDate { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// 1=In Progress, 2=Completed, 3=Submitted
        /// </summary>
        public byte FormStatus { get; set; } = 1;

        [MaxLength(50)] public string? IpAddress { get; set; }

        [MaxLength(500)] public string? UserAgent { get; set; }

        [MaxLength(200)] public string? DeviceFingerprint { get; set; }

        public DateTime? SessionExpiryDate { get; set; }
        public bool IsExpired { get; set; } = false;

        public int? KycDetailId { get; set; }
        [ForeignKey("KycDetailId")] public virtual KycDetail? KycDetail { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? ModifiedDate { get; set; }

        public virtual ICollection<KycStepCompletion> StepCompletions { get; set; } = new List<KycStepCompletion>();
        public virtual ICollection<KycOtpVerification> OtpVerifications { get; set; } = new List<KycOtpVerification>();
    }
}
