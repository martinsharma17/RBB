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

        // ==========================================
        // DUAL-TOKEN SECURITY FIELDS
        // ==========================================
        // These fields support anonymous KYC sessions where users verify via email OTP.
        // The VerificationToken is sent in HTTP headers, while SessionToken is in the URL.
        // This dual-token approach prevents unauthorized access if the URL is leaked.

        /// <summary>
        /// Verification token (16-char GUID segment) issued after email OTP verification.
        /// Required in HTTP header 'X-KYC-Verification' for anonymous sessions.
        /// </summary>
        [MaxLength(50)]
        public string? VerificationToken { get; set; }

        /// <summary>
        /// Expiration timestamp for the verification token (typically 48 hours from verification).
        /// After expiry, users must re-verify their email to get a new token.
        /// </summary>
        public DateTime? VerificationTokenExpiry { get; set; }

        /// <summary>
        /// IP address from which the email was verified.
        /// Used for security monitoring and potential re-verification triggers.
        /// </summary>
        [MaxLength(50)]
        public string? VerifiedFromIp { get; set; }

        /// <summary>
        /// User-Agent string of the device that verified the email.
        /// Helps detect session hijacking attempts from different devices.
        /// </summary>
        [MaxLength(500)]
        public string? VerifiedUserAgent { get; set; }

        public virtual KycDetail? KycDetail { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? ModifiedDate { get; set; }

        public virtual ICollection<KycStepCompletion> StepCompletions { get; set; } = new List<KycStepCompletion>();
        public virtual ICollection<KycOtpVerification> OtpVerifications { get; set; } = new List<KycOtpVerification>();
    }
}
    