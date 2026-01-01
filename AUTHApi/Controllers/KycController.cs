using AUTHApi.DTOs;
using AUTHApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using AUTHApi.Data;
using Microsoft.EntityFrameworkCore;

namespace AUTHApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KycController : BaseApiController
    {
        private readonly IKycService _kycService;
        private readonly ILogger<KycController> _logger;
        private readonly ApplicationDbContext _context;

        public KycController(IKycService kycService, ILogger<KycController> logger, ApplicationDbContext context)
        {
            _kycService = kycService;
            _logger = logger;
            _context = context;
        }

        // --- Authenticated Flows (Restored) ---

        /// <summary>
        /// Retrieves or creates an active KYC session for the logged-in user.
        /// </summary>
        [HttpGet("my-session")]
        [Authorize]
        public async Task<IActionResult> GetMySession()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var email = User.FindFirstValue(ClaimTypes.Email);

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
                    return Failure("Unauthorized", 401);

                // Use the service to handle session logic (creation, seeding, linking)
                // Assuming GetOrCreateSessionAsync exists in IKycService as per previous views
                var session = await _kycService.GetOrCreateSessionAsync(userId, email);

                return Success(new
                {
                    sessionId = session.Id,
                    sessionToken = session.SessionToken,
                    currentStep = session.CurrentStep,
                    status = session.FormStatus,
                    isEmailVerified = session.EmailVerified
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving session for user");
                return Failure("An unexpected error occurred while retrieving the session.", 500);
            }
        }

        /// <summary>
        /// Submits the KYC session for verification (Maker action).
        /// </summary>
        [HttpPost("submit/{sessionId}")]
        [Authorize]
        public async Task<IActionResult> SubmitKyc(int sessionId)
        {
            var session = await _context.KycFormSessions.FindAsync(sessionId);
            if (session == null) return Failure("Session not found", 404);

            // Verify all required steps are completed
            var requiredSteps = await _context.KycFormSteps.Where(s => s.IsRequired).Select(s => s.StepNumber)
                .ToListAsync();
            var completedSteps = await _context.KycStepCompletions
                .Where(sc => sc.SessionId == sessionId && sc.IsCompleted)
                .Select(sc => sc.StepNumber)
                .ToListAsync();

            if (!requiredSteps.All(rs => completedSteps.Contains(rs)))
            {
                var missingSteps = requiredSteps.Except(completedSteps).ToList();
                return Failure(
                    $"Please complete all required steps before submission. Missing steps: {string.Join(", ", missingSteps)}");
            }

            session.FormStatus = 3; // Submitted
            session.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Success("KYC submitted successfully for review.");
        }

        // --- Unauthenticated Flows (New) ---

        /// <summary>
        /// Initiates an unauthenticated KYC session for a new user.
        /// Sends an email verification link to the provided email address.
        /// </summary>
        [HttpPost("initiate-session")]
        public async Task<IActionResult> InitiateKycSession([FromBody] InitiateKycDto model)
        {
            if (!ModelState.IsValid)
            {
                return Failure("Invalid email address provided.", 400,
                    ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            }

            try
            {
                var (session, errorMessage) = await _kycService.InitiateUnauthenticatedKycAsync(model.Email);

                if (session == null)
                {
                    _logger.LogWarning("Failed to initiate KYC for {Email}: {ErrorMessage}", model.Email, errorMessage);
                    return Failure(errorMessage ?? "Failed to initiate KYC session.", 400);
                }

                return Success(new
                {
                    sessionId = session.Id,
                    message = "KYC session initiated. Please check your email for a verification link to continue."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating KYC session for {Email}", model.Email);
                return InternalServerError("An unexpected error occurred while initiating KYC.");
            }
        }

        /// <summary>
        /// Verifies the email for an unauthenticated KYC session.
        /// </summary>
        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyKycEmail([FromQuery] string sessionToken,
            [FromQuery] string verificationToken, [FromQuery] int sessionId)
        {
            if (string.IsNullOrEmpty(sessionToken) || string.IsNullOrEmpty(verificationToken) || sessionId <= 0)
            {
                return Failure("Invalid verification link.", 400);
            }

            try
            {
                // Note: The logic expects verificationToken, but service might use sessionToken as verificationToken
                // Adjusting based on Logic in service: VerifyKycEmailAsync(sessionToken, verificationToken)
                var isVerified = await _kycService.VerifyKycEmailAsync(sessionToken, verificationToken);

                if (isVerified)
                {
                    return Success("Email verified successfully. You can now proceed with your KYC application.");
                }
                else
                {
                    return Failure("Invalid or expired verification link.", 400);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying KYC email for session {SessionId}", sessionId);
                return InternalServerError("An unexpected error occurred during email verification.");
            }
        }

        /// <summary>
        /// Retrieves the dynamic form structure (schema) for a specific KYC step.
        /// </summary>
        [HttpGet("form-structure/{stepNumber}")]
        public async Task<IActionResult> GetStepFormStructure([FromRoute] int stepNumber)
        {
            try
            {
                var schemaJson = await _kycService.GetStepFormSchemaAsync(stepNumber);

                if (string.IsNullOrEmpty(schemaJson))
                {
                    return NotFound($"Form schema for step {stepNumber} not found.");
                }

                return Content(schemaJson, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving form schema for step {StepNumber}", stepNumber);
                return InternalServerError("An unexpected error occurred while retrieving form schema.");
            }
        }

        /// <summary>
        /// Saves or updates the KYC data for a specific step within an unauthenticated session.
        /// </summary>
        [HttpPut("save-data/{sessionId}/{stepNumber}")]
        public async Task<IActionResult> SaveKycData(
            [FromRoute] int sessionId,
            [FromRoute] int stepNumber,
            [FromBody] JsonElement data)
        {
            if (sessionId <= 0 || stepNumber <= 0)
            {
                return Failure("Invalid session ID or step number.", 400);
            }

            try
            {
                await _kycService.UpdateDetailWithJsonAsync(sessionId, stepNumber, data);
                return Success(new { sessionId, stepNumber, message = "KYC data saved successfully." });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Validation error saving KYC data: {Message}", ex.Message);
                return Failure(ex.Message, 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving KYC data");
                return InternalServerError("An unexpected error occurred while saving KYC data.");
            }
        }
    }
}
