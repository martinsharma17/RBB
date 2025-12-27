using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycFamily
    {
        [Key] public int Id { get; set; }

        public int? SessionId { get; set; }
        [ForeignKey("SessionId")] public virtual KycFormSession? Session { get; set; }

        public int? KycPersonalInfoId { get; set; }
        [ForeignKey("KycPersonalInfoId")] public virtual KycPersonalInfo? PersonalInfo { get; set; }

        [MaxLength(200)] public string? GrandFatherName { get; set; }
        [MaxLength(200)] public string? FatherName { get; set; }
        [MaxLength(200)] public string? MotherName { get; set; }
        [MaxLength(200)] public string? SpouseName { get; set; }
        [MaxLength(200)] public string? SonName { get; set; }
        [MaxLength(200)] public string? DaughterName { get; set; }
        [MaxLength(200)] public string? DaughterInLawName { get; set; }
        [MaxLength(200)] public string? FatherInLawName { get; set; }
        [MaxLength(200)] public string? MotherInLawName { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public DateTime? ModifiedDate { get; set; }
        public bool IsDraft { get; set; } = true;
    }
}
