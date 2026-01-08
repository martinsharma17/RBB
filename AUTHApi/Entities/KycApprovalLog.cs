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
        [Key] public int Id { get; set; }

        [Required] public int KycWorkflowId { get; set; }
        [ForeignKey("KycWorkflowId")] public virtual KycWorkflowMaster? KycWorkflow { get; set; }

        [Required] public int KycSessionId { get; set; }
        [ForeignKey("KycSessionId")] public virtual KycFormSession? KycSession { get; set; }

        /// <summary>
        /// The role of the user who performed the action.
        /// </summary>
        public string? RoleId { get; set; }

        /// <summary>
        /// The user who performed the action.
        /// </summary>
        public string? UserId { get; set; }

        [ForeignKey("UserId")] public virtual ApplicationUser? User { get; set; }

        /// <summary>
        /// Action taken: approved, rejected, resubmitted, etc.
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = string.Empty;

        public string? Remarks { get; set; }

        /// <summary>
        /// The role that performed the action (e.g., Maker, Checker).
        /// </summary>
        public string? ActionedByRoleId { get; set; }

        /// <summary>
        /// The role that the KYC was moved to after this action.
        /// </summary>
        public string? ForwardedToRoleId { get; set; }

        /// <summary>
        /// Security Audit: IP Address of the user/system performing the action.
        /// </summary>
        [MaxLength(45)]
        public string? ClientIpAddress { get; set; }

        /// <summary>
        /// Security Audit: Browser/System info.
        /// </summary>
        public string? UserAgent { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
