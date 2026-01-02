using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    /// <summary>
    /// Audit trail for KYC approval actions.
    /// </summary>
    public class KycApprovalLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int KycWorkflowId { get; set; }
        [ForeignKey("KycWorkflowId")]
        public virtual KycWorkflowMaster? KycWorkflow { get; set; }

        /// <summary>
        /// The role of the user who performed the action.
        /// </summary>
        public string? RoleId { get; set; }

        /// <summary>
        /// The user who performed the action.
        /// </summary>
        public string? UserId { get; set; }
        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }

        /// <summary>
        /// Action taken: approved, rejected, resubmitted, etc.
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = string.Empty;

        public string? Remarks { get; set; }

        /// <summary>
        /// Workflow moved from this role.
        /// </summary>
        public string? FromRoleId { get; set; }

        /// <summary>
        /// Workflow moved to this role.
        /// </summary>
        public string? ToRoleId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
