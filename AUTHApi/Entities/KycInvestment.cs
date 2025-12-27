using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    /// <summary>
    /// Section 8: Other Investment information.
    /// Linked 1:1 with the main KycForm.
    /// </summary>
    public class KycInvestment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int KycFormId { get; set; }

        [ForeignKey("KycFormId")]
        public virtual KycForm? KycForm { get; set; }

        public string? Details { get; set; }

        public bool IsInvolved { get; set; }
    }
}
