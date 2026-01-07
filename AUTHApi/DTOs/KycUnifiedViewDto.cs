using System;

namespace AUTHApi.DTOs
{
    /// <summary>
    /// A flattened, unified view combining customer personal data with their current approval workflow status.
    /// This is ideal for Admin Dashboards and Staff Queues.
    /// </summary>
    public class KycUnifiedViewDto
    {
        // Workflow Info
        public int WorkflowId { get; set; }
        public string? Status { get; set; }
        public int PendingLevel { get; set; }
        public string? CurrentRoleName { get; set; }
        public string? SubmittedRoleName { get; set; }
        public string? FullChain { get; set; }

        // Data Info (from KycDetail)
        public int KycId { get; set; }
        public string? CustomerName { get; set; }
        public string? Email { get; set; }
        public string? MobileNumber { get; set; }
        public string? CitizenshipNumber { get; set; }
        public string? PermanentAddress { get; set; }

        // Audit Meta
        public DateTime CreatedAt { get; set; }
        public DateTime? LastUpdatedAt { get; set; }
        public string? LastRemarks { get; set; }
    }
}
