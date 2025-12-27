using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycOtpVerification
    {
        [Key] public int Id { get; set; }

        [Required] public int SessionId { get; set; }

        [ForeignKey("SessionId")] public virtual KycFormSession? Session { get; set; }

        /// <summary>
        /// 1=Email, 2=Mobile
        /// </summary>
        public byte OtpType { get; set; }

        [Required] [MaxLength(10)] public string OtpCode { get; set; } = string.Empty;

        [MaxLength(500)] public string? OtpHash { get; set; }

        [MaxLength(100)] public string? SentToEmail { get; set; }

        [MaxLength(20)] public string? SentToMobile { get; set; }

        public bool IsVerified { get; set; } = false;
        public DateTime? VerifiedDate { get; set; }

        [Required] public DateTime ExpiryDate { get; set; }

        public bool IsExpired { get; set; } = false;
        public int AttemptCount { get; set; } = 0;
        public int MaxAttempts { get; set; } = 3;

        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
