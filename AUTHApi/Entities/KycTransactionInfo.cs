using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycTransactionInfo
    {
        [Key] public int Id { get; set; }

        public int? SessionId { get; set; }
        [ForeignKey("SessionId")] public virtual KycFormSession? Session { get; set; }

        public int? KycPersonalInfoId { get; set; }
        [ForeignKey("KycPersonalInfoId")] public virtual KycPersonalInfo? PersonalInfo { get; set; }

        [MaxLength(200)] public string? SourceOfNetWorth { get; set; }

        [MaxLength(200)] public string? MajorSourceOfIncome { get; set; }

        public bool HasOtherBrokerAccount { get; set; } = false;
        [MaxLength(500)] public string? OtherBrokerNames { get; set; }

        public bool IsCibBlacklisted { get; set; } = false;
        [MaxLength(500)] public string? CibBlacklistDetails { get; set; }

        public bool InvolvedInInvestmentCompany { get; set; } = false;
        [MaxLength(300)] public string? InvestmentCompanyName { get; set; }
        public byte? RoleInInvestmentCompany { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public DateTime? ModifiedDate { get; set; }
        public bool IsDraft { get; set; } = true;
    }
}
