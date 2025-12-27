using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycFormSteps
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int StepNumber { get; set; }

        [Required]
        [MaxLength(100)]
        public string StepName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? StepNameNepali { get; set; }

        [MaxLength(500)]
        public string? StepDescription { get; set; }

        [MaxLength(100)]
        public string? TableName { get; set; }

        public bool IsRequired { get; set; } = true;
        public int? DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
