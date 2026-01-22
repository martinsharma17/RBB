using AUTHApi.DTOs;
using AUTHApi.Services;
using Microsoft.AspNetCore.Mvc;
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
        private readonly IKycWorkflowService _workflowService;

        public KycController(IKycService kycService, ILogger<KycController> logger, ApplicationDbContext context,
            IKycWorkflowService workflowService)
        {
            _kycService = kycService;
            _logger = logger;
            _context = context;
            _workflowService = workflowService;
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

        [HttpPost("submit/{sessionToken}")]
        public async Task<IActionResult> SubmitKyc(Guid sessionToken)
        {
            var session = await _context.KycFormSessions.FirstOrDefaultAsync(s => s.SessionToken == sessionToken);
            if (session == null) return Failure("Session not found", 404);

            // Ownership Check
            if (session.UserId != null && session.UserId != User.FindFirstValue(ClaimTypes.NameIdentifier))
                return Forbid();

            // Verify all required steps are completed
            var requiredSteps = await _context.KycFormSteps.Where(s => s.IsRequired).Select(s => s.StepNumber).ToListAsync();
            var completedSteps = await _context.KycStepCompletions
                .Where(sc => sc.SessionId == session.Id && sc.IsCompleted)
                .Select(sc => sc.StepNumber)
                .ToListAsync();

            if (!requiredSteps.All(rs => completedSteps.Contains(rs)))
            {
                var missingStepNumbers = requiredSteps.Except(completedSteps).ToList();
                var missingStepNames = await _context.KycFormSteps
                    .Where(s => missingStepNumbers.Contains(s.StepNumber))
                    .Select(s => s.StepName).ToListAsync();

                return Failure($"Please complete all required sections: {string.Join(", ", missingStepNames)}");
            }

            session.FormStatus = 3; // Submitted
            session.ModifiedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var (wfSuccess, wfMessage) = await _workflowService.InitiateWorkflowAsync(session.Id, userId ?? "System");

            if (!wfSuccess) return Failure("Submission partially failed: " + wfMessage, 500);
            return Success("KYC submitted successfully.");
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

        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyKycEmail([FromQuery] string sessionToken, [FromQuery] string verificationToken)
        {
            if (string.IsNullOrEmpty(sessionToken) || string.IsNullOrEmpty(verificationToken))
                return Failure("Invalid verification link.", 400);

            try
            {
                var isVerified = await _kycService.VerifyKycEmailAsync(sessionToken, verificationToken);
                return isVerified ? Success("Email verified successfully.") : Failure("Invalid verification link.", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying KYC email {Token}", sessionToken);
                return InternalServerError("An unexpected error occurred.");
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

        [HttpPut("save-data/{sessionToken}/{stepNumber}")]
        public async Task<IActionResult> SaveKycData(Guid sessionToken, int stepNumber, [FromBody] JsonElement data)
        {
            try
            {
                await _kycService.UpdateDetailWithJsonAsync(sessionToken, stepNumber, data);
                return Success(new { sessionToken, stepNumber, message = "KYC data saved successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving KYC data");
                return Failure(ex.Message, 400);
            }
        }
    }
}
