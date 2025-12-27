using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycAmlCompliance
    {
        [Key] public int Id { get; set; }

        public int? SessionId { get; set; }
        [ForeignKey("SessionId")] public virtual KycFormSession? Session { get; set; }

        public int? KycPersonalInfoId { get; set; }
        [ForeignKey("KycPersonalInfoId")] public virtual KycPersonalInfo? PersonalInfo { get; set; }

        public bool IsPoliticallyExposedPerson { get; set; } = false;

        public bool IsRelatedToPep { get; set; } = false;
        [MaxLength(200)] public string? PepRelationName { get; set; }
        [MaxLength(100)] public string? PepRelationship { get; set; }

        public bool HasBeneficialOwner { get; set; } = false;
        [MaxLength(200)] public string? BeneficialOwnerName { get; set; }
        [MaxLength(100)] public string? BeneficialOwnerRelationship { get; set; }

        public bool HasCriminalRecord { get; set; } = false;
        [MaxLength(1000)] public string? CriminalRecordDetails { get; set; }

        public bool IsActualOwnerDifferent { get; set; } = false;

        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public DateTime? ModifiedDate { get; set; }
        public bool IsDraft { get; set; } = true;
    }
}
