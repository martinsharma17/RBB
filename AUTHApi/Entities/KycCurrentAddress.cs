using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycCurrentAddress
    {
        [Key] public int Id { get; set; }

        public int? SessionId { get; set; }
        [ForeignKey("SessionId")] public virtual KycFormSession? Session { get; set; }

        public int? KycPersonalInfoId { get; set; }
        [ForeignKey("KycPersonalInfoId")] public virtual KycPersonalInfo? PersonalInfo { get; set; }

        [MaxLength(100)] public string Country { get; set; } = "Nepal";

        [MaxLength(100)] public string? Province { get; set; }

        [MaxLength(100)] public string? District { get; set; }

        /// <summary>
        /// 1=Metropolitan, 2=Sub-Metropolitan, 3=Municipality, 4=Rural Municipality
        /// </summary>
        public byte? MunicipalityType { get; set; }

        [MaxLength(200)] public string? MunicipalityName { get; set; }

        public int? WardNo { get; set; }

        [MaxLength(200)] public string? Tole { get; set; }

        [MaxLength(20)] public string? TelephoneNo { get; set; }

        [Required] [MaxLength(20)] public string MobileNo { get; set; } = string.Empty;

        [MaxLength(100)] public string? EmailId { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public DateTime? ModifiedDate { get; set; }
        public bool IsDraft { get; set; } = true;
    }
}
