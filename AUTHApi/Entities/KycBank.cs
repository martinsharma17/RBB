using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycBank
    {
        [Key] public int Id { get; set; }

        public int? SessionId { get; set; }
        [ForeignKey("SessionId")] public virtual KycFormSession? Session { get; set; }

        public int? KycPersonalInfoId { get; set; }
        [ForeignKey("KycPersonalInfoId")] public virtual KycPersonalInfo? PersonalInfo { get; set; }

        /// <summary>
        /// 1=Saving, 2=Current
        /// </summary>
        public byte? AccountType { get; set; }

        [Required] [MaxLength(50)] public string BankAccountNo { get; set; } = string.Empty;

        [Required] [MaxLength(200)] public string BankName { get; set; } = string.Empty;

        [MaxLength(500)] public string? BankAddress { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public DateTime? ModifiedDate { get; set; }
        public bool IsDraft { get; set; } = true;
        public bool IsActive { get; set; } = true;
    }
}
