using System.ComponentModel.DataAnnotations;

namespace AUTHApi.Entities
{
    /// <summary>
    /// Configuration for the KYC approval workflow.
    /// Defines which roles must approve a KYC form in what order.
    /// </summary>
    public class KycApprovalConfig
    {
        [Key] public int Id { get; set; }

        /// <summary>
        /// The role ID for which this configuration applies (e.g., Maker's starting chain).
        /// </summary>
        [Required]
        public string RoleId { get; set; } = string.Empty;

        /// <summary>
        /// The approval chain steps for this configuration.
        /// </summary>
        public virtual ICollection<KycApprovalStep> Steps { get; set; } = new List<KycApprovalStep>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
