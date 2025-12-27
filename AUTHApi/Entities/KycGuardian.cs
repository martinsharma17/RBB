using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycGuardian
    {
        [Key] public int Id { get; set; }

        public int? SessionId { get; set; }
        [ForeignKey("SessionId")] public virtual KycFormSession? Session { get; set; }

        public int? KycPersonalInfoId { get; set; }
        [ForeignKey("KycPersonalInfoId")] public virtual KycPersonalInfo? PersonalInfo { get; set; }

        [Required] [MaxLength(200)] public string GuardianFullName { get; set; } = string.Empty;

        [Required] [MaxLength(100)] public string RelationshipWithApplicant { get; set; } = string.Empty;

        [MaxLength(500)] public string? CorrespondenceAddress { get; set; }
        [MaxLength(100)] public string? Country { get; set; }
        [MaxLength(100)] public string? Province { get; set; }
        [MaxLength(100)] public string? District { get; set; }
        public byte? MunicipalityType { get; set; }
        [MaxLength(200)] public string? MunicipalityName { get; set; }
        public int? WardNo { get; set; }

        [MaxLength(20)] public string? FaxNo { get; set; }
        [MaxLength(20)] public string? TelephoneNo { get; set; }
        [MaxLength(20)] public string? MobileNo { get; set; }
        [MaxLength(100)] public string? EmailId { get; set; }

        [MaxLength(50)] public string? PermanentAccountNo { get; set; }
        [MaxLength(50)] public string? BirthRegNo { get; set; }
        public DateTime? BirthRegIssueDate { get; set; }
        [MaxLength(200)] public string? BirthRegIssuingAuthority { get; set; }

        [MaxLength(200)] public string? GuardianPhotoFileName { get; set; }
        [MaxLength(500)] public string? GuardianPhotoFilePath { get; set; }
        public long? GuardianPhotoFileSize { get; set; }

        [MaxLength(200)] public string? GuardianSignatureFileName { get; set; }
        [MaxLength(500)] public string? GuardianSignatureFilePath { get; set; }
        public long? GuardianSignatureFileSize { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public DateTime? ModifiedDate { get; set; }
        public bool IsDraft { get; set; } = true;
    }
}
