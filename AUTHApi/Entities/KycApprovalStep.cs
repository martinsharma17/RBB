using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace AUTHApi.Entities
{
    /// <summary>
    /// A specific step in an approval chain.
    /// Links a configuration to a role that must approve at this stage.
    /// </summary>
    public class KycApprovalStep
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ConfigId { get; set; }

        [ForeignKey("ConfigId")]
        public virtual KycApprovalConfig? Config { get; set; }

        /// <summary>
        /// The unique ID of the role that must perform the action at this step.
        /// </summary>
        [Required]
        public string RoleId { get; set; } = string.Empty;

        /// <summary>
        /// The sequence of this step in the chain (0, 1, 2, ...).
        /// </summary>
        public int StepOrder { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
