using System.Threading.Tasks;
using AUTHApi.Entities;
using AUTHApi.DTOs;

namespace AUTHApi.Services
{
    /// <summary>
    /// Service interface that encapsulates all KYC data operations.
    /// It abstracts the controller from EF Core details and makes the code testable.
    /// </summary>
    public interface IKycService
    {
        /// <summary>
        /// Retrieves an existing KycDetail for the given session or creates a new one.
        /// </summary>
        Task<KycDetail> GetOrCreateDetailAsync(int sessionId);

        /// <summary>
        /// Updates the KycDetail with data from a step‑specific DTO.
        /// </summary>
        Task<int> UpdateDetailAsync<TDto>(int sessionId, int stepNumber, TDto dto);

        /// <summary>
        /// Uploads a document and creates a KycDocument record.
        /// </summary>
        Task<KycDocument> UploadDocumentAsync(int sessionId, string documentType, string fileName, byte[] content,
            string contentType);

        /// <summary>
        /// Retrieves the progress information for a KYC session.
        /// </summary>
        /// <returns>Progress DTO or null if session not found.</returns>
        Task<KycProgressDto?> GetProgressAsync(int sessionId);

        /// <summary>
        /// Retrieves an existing KYC session or creates a new one for the user/email.
        /// Handles initial step seeding if creating a new session.
        /// </summary>
        Task<KycFormSession> GetOrCreateSessionAsync(string? userId, string? email);

        /// <summary>
        /// Initiates an unauthenticated KYC session for a given email.
        /// Returns a session token and sends an email verification.
        /// </summary>
        Task<(KycFormSession? session, string? errorMessage)> InitiateUnauthenticatedKycAsync(string email);

        /// <summary>
        /// Verifies the email for an unauthenticated KYC session.
        /// </summary>
        Task<bool> VerifyKycEmailAsync(string sessionToken, string verificationToken);

        /// <summary>
        /// Retrieves the dynamic form structure for a specific KYC step.
        /// </summary>
        Task<string?> GetStepFormSchemaAsync(int stepNumber);

        /// <summary>
        /// Updates the KycDetail with a dynamic JSON payload for a given step.
        /// The service will handle deserialization to the appropriate DTO based on the step number.
        /// </summary>
        Task UpdateDetailWithJsonAsync(int sessionId, int stepNumber, System.Text.Json.JsonElement data);
    }
}
