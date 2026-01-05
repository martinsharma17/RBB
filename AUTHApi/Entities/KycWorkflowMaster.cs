using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public enum KycWorkflowStatus
    {
        InProgress = 1,
        Approved = 2,
        Rejected = 3,
        ResubmissionRequired = 4,
        InReview = 5
    }

    /// <summary>
    /// Represents the current state of a KYC form in the approval workflow.
    /// </summary>
    public class KycWorkflowMaster
    {
        [Key] public int Id { get; set; }

        /// <summary>
        /// FK to the KYC Session.
        /// </summary>
        [Required]
        public int KycSessionId { get; set; }

        [ForeignKey("KycSessionId")] public virtual KycFormSession? KycSession { get; set; }

        /// <summary>
        /// The role that originally submitted the form (e.g., Maker).
        /// </summary>
        public string? SubmittedRoleId { get; set; }

        /// <summary>
        /// The role that currently needs to take action.
        /// </summary>
        public string? CurrentRoleId { get; set; }

        /// <summary>
        /// How many approval levels are remaining.
        /// </summary>
        public int PendingLevel { get; set; }

        /// <summary>
        /// Overall status of the workflow.
        /// </summary>
        [Required]
        public KycWorkflowStatus Status { get; set; } = KycWorkflowStatus.InReview;

        public string? LastRemarks { get; set; }

        /// <summary>
        /// Numeric representation of the Role (0: User, 1: Maker, 2: Checker, 3: RBBSec)
        /// </summary>
        public int CurrentOrderLevel { get; set; }

        /// <summary>
        /// Numeric representation of the Submitter's Role (0: User, 1: Maker, 2: Checker, 3: RBBSec)
        /// </summary>
        public int SubmittedOrderLevel { get; set; }

        /// <summary>
        /// The full sequence of roles for this workflow (e.g., "Maker -> Checker -> RBBSec").
        /// </summary>
        public string? FullChain { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}


