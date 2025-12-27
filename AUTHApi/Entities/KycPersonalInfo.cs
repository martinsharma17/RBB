using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycPersonalInfo
    {
        [Key] public int Id { get; set; }

        public int? SessionId { get; set; }
        [ForeignKey("SessionId")] public virtual KycFormSession? Session { get; set; }

        [MaxLength(50)] public string? ClientAccountNo { get; set; }
        public DateTime? FormDate { get; set; }
        [MaxLength(50)] public string? ReferenceNo { get; set; }
        [MaxLength(50)] public string? SanctionScreeningNo { get; set; }

        [Required] [MaxLength(200)] public string FullName { get; set; } = string.Empty;

        [MaxLength(20)] public string? DateOfBirthBs { get; set; }
        public DateTime? DateOfBirthAd { get; set; }

        /// <summary>
        /// 1=Male, 2=Female, 3=Others
        /// </summary>
        public byte? Gender { get; set; }

        public bool IsNepali { get; set; } = true;
        [MaxLength(100)] public string? OtherNationality { get; set; }

        [MaxLength(50)] public string? CitizenshipNo { get; set; }
        [MaxLength(100)] public string? CitizenshipIssueDistrict { get; set; }
        public DateTime? CitizenshipIssueDate { get; set; }

        [MaxLength(50)] public string? BeneficiaryIdNo { get; set; }
        [MaxLength(50)] public string? PermanentAccountNo { get; set; }

        [MaxLength(100)] public string? NrnIdentificationNo { get; set; }
        [MaxLength(500)] public string? NrnAddress { get; set; }

        [MaxLength(200)] public string? PhotoFileName { get; set; }
        [MaxLength(500)] public string? PhotoFilePath { get; set; }
        public long? PhotoFileSize { get; set; }
        public DateTime? PhotoUploadedDate { get; set; }

        [MaxLength(100)] public string? CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        [MaxLength(100)] public string? ModifiedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDraft { get; set; } = true;
    }
}
