using System.Threading.Tasks;

namespace AUTHApi.Services
{
    public interface IKycWorkflowService
    {
        /// <summary>
        /// Starts the approval workflow for a submitted KYC session.
        /// </summary>
        Task<(bool success, string message)> InitiateWorkflowAsync(int kycSessionId, string userId);

        /// <summary>
        /// Approves the KYC at the current level and moves it to the next role.
        /// </summary>
        Task<(bool success, string message)> ApproveAsync(int workflowId, string userId, string remarks);

        /// <summary>
        /// Rejects the KYC and sends it back to the previous role or Maker.
        /// </summary>
        Task<(bool success, string message)> RejectAsync(int workflowId, string userId, string remarks,
            bool returnToPrevious = false);

        /// <summary>
        /// Gets the pending KYC list for a specific role.
        /// </summary>
        Task<object> GetPendingKycsAsync(string roleId);
    }
}
