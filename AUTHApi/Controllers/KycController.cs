using AUTHApi.Data;
using AUTHApi.Entities;
using AUTHApi.Models.KYC;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AUTHApi.Controllers
{
    /// <summary>
    /// Unified Controller for KYC Management, Reviews, and Maker/Checker Workflow.
    /// Bridges Authenticated Users to their KYC Sessions.
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class KycController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AUTHApi.Services.IKycService _kycService;

        public KycController(ApplicationDbContext context, UserManager<ApplicationUser> userManager,
            AUTHApi.Services.IKycService kycService)
        {
            _context = context;
            _userManager = userManager;
            _kycService = kycService;
        }

        /// <summary>
        /// Retrieves or creates an active KYC session for the logged-in user.
        /// </summary>
        [HttpGet("my-session")]
        public async Task<IActionResult> GetMySession()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var email = User.FindFirstValue(ClaimTypes.Email);

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
                    return Failure("Unauthorized", 401);

                // Use the service to handle session logic (creation, seeding, linking)
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
                // In production, do not expose stack traces.
                // Log the error internally (the logger is available in BaseApiController or can be injected)
                return Failure("An unexpected error occurred while retrieving the session.", 500);
            }
        }

        /// <summary>
        /// Submits the KYC session for verification (Maker action).
        /// </summary>
        [HttpPost("submit/{sessionId}")]
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
                return Failure("Please complete all required steps before submission.");
            }

            session.FormStatus = 3; // Submitted
            session.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Success("KYC submitted successfully for review.");
        }

        /// <summary>
        /// Maker Verification: Marks the KYC as verified by a staff member.
        /// </summary>
        [HttpPost("maker/verify/{sessionId}")]
        [Authorize(Roles = "SuperAdmin,Admin,Manager")]
        public async Task<IActionResult> MakerVerify(int sessionId)
        {
            var session = await _context.KycFormSessions.FindAsync(sessionId);
            if (session == null) return Failure("Session not found", 404);
            if (session.FormStatus != 3) return Failure("KYC must be submitted first.");

            // In a real scenario, we might move this to a 'Verified' status
            // For now, let's just update activity
            session.LastActivityDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Success("KYC verified by Maker.");
        }

        /// <summary>
        /// Checker Approval: Final approval of the KYC.
        /// </summary>
        [HttpPost("checker/approve/{sessionId}")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> CheckerApprove(int sessionId)
        {
            var session = await _context.KycFormSessions.FindAsync(sessionId);
            if (session == null) return Failure("Session not found", 404);

            session.FormStatus = 2; // Completed/Approved
            session.ModifiedDate = DateTime.UtcNow;

            // Here we could also update the main ApplicationUser profile if needed

            await _context.SaveChangesAsync();
            return Success("KYC approved successfully.");
        }
    }
}
