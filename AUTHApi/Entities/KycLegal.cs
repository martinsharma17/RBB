using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    /// <summary>
    /// Section 7: Legal Declaration and Consent.
    /// Linked 1:1 with the main KycForm.
    /// </summary>
    public class KycLegal
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int KycFormId { get; set; }

        [ForeignKey("KycFormId")]
        public virtual KycForm? KycForm { get; set; }

        public string? DeclarationText { get; set; }

        public DateTime? ConsentDate { get; set; }

        public bool IsAgreed { get; set; }
    }
}
