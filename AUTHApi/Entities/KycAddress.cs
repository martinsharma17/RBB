using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    /// <summary>
    /// Section 2: Address Details (Current and Permanent).
    /// Linked 1:1 with the main KycForm.
    /// </summary>
    public class KycAddress
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int KycFormId { get; set; }

        [ForeignKey("KycFormId")]
        public virtual KycForm? KycForm { get; set; }

        // Current Address
        [MaxLength(100)]
        public string? CurrentMunicipality { get; set; }
        [MaxLength(100)]
        public string? CurrentDistrict { get; set; }
        [MaxLength(100)]
        public string? CurrentProvince { get; set; }
        [MaxLength(100)]
        public string? CurrentCountry { get; set; }

        // Permanent Address
        [MaxLength(100)]
        public string? PermanentMunicipality { get; set; }
        [MaxLength(100)]
        public string? PermanentDistrict { get; set; }
        [MaxLength(100)]
        public string? PermanentProvince { get; set; }
        [MaxLength(100)]
        public string? PermanentCountry { get; set; }

        [MaxLength(20)]
        public string? WardNo { get; set; }

        [MaxLength(50)]
        public string? ContactNumber { get; set; }

        [MaxLength(255)]
        public string? Email { get; set; }
    }
}
