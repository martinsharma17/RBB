using System.ComponentModel.DataAnnotations;

namespace AUTHApi.Entities
{
    /// <summary>
    /// Represents a branch office within the organization.
    /// Used for assigning KYC forms to specific branches.
    /// </summary>
    public class Branch
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Code { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Location { get; set; }
    }
}
