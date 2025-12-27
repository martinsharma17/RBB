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
    public class KycController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public KycController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        /// <summary>
        /// Retrieves or creates an active KYC session for the logged-in user.
        /// </summary>
        [HttpGet("my-session")]
        public async Task<IActionResult> GetMySession()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var email = User.FindFirstValue(ClaimTypes.Email);

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
                return Unauthorized();

            var session = await _context.KycFormSessions
                .Include(s => s.PersonalInfo)
                .Include(s => s.StepCompletions)
                .FirstOrDefaultAsync(s => s.UserId == userId || s.Email == email);

            if (session == null)
            {
                session = new KycFormSession
                {
                    UserId = userId,
                    Email = email,
                    SessionExpiryDate = DateTime.Now.AddDays(30),
                    CurrentStep = 1
                };
                await _context.KycFormSessions.AddAsync(session);
                await _context.SaveChangesAsync();

                // Seed steps for new session
                var steps = await _context.KycFormSteps.Where(s => s.IsActive).ToListAsync();
                foreach (var step in steps)
                {
                    await _context.KycStepCompletions.AddAsync(new KycStepCompletion
                    {
                        SessionId = session.Id,
                        StepNumber = step.StepNumber
                    });
                }

                await _context.SaveChangesAsync();
            }
            else if (session.UserId == null)
            {
                // Link session if it was previously created via guest email flow
                session.UserId = userId;
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                sessionId = session.Id,
                sessionToken = session.SessionToken,
                currentStep = session.CurrentStep,
                status = session.FormStatus,
                isEmailVerified = session.EmailVerified
            });
        }

        /// <summary>
        /// Submits the KYC session for verification (Maker action).
        /// </summary>
        [HttpPost("submit/{sessionId}")]
        public async Task<IActionResult> SubmitKyc(int sessionId)
        {
            var session = await _context.KycFormSessions.FindAsync(sessionId);
            if (session == null) return NotFound("Session not found");

            // Verify all required steps are completed
            var requiredSteps = await _context.KycFormSteps.Where(s => s.IsRequired).Select(s => s.StepNumber)
                .ToListAsync();
            var completedSteps = await _context.KycStepCompletions
                .Where(sc => sc.SessionId == sessionId && sc.IsCompleted)
                .Select(sc => sc.StepNumber)
                .ToListAsync();

            if (!requiredSteps.All(rs => completedSteps.Contains(rs)))
            {
                return BadRequest("Please complete all required steps before submission.");
            }

            session.FormStatus = 3; // Submitted
            session.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { message = "KYC submitted successfully for review." });
        }

        /// <summary>
        /// Maker Verification: Marks the KYC as verified by a staff member.
        /// </summary>
        [HttpPost("maker/verify/{sessionId}")]
        [Authorize(Roles = "SuperAdmin,Admin,Manager")]
        public async Task<IActionResult> MakerVerify(int sessionId)
        {
            var session = await _context.KycFormSessions.FindAsync(sessionId);
            if (session == null) return NotFound();
            if (session.FormStatus != 3) return BadRequest("KYC must be submitted first.");

            // In a real scenario, we might move this to a 'Verified' status
            // For now, let's just update activity
            session.LastActivityDate = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "KYC verified by Maker." });
        }

        /// <summary>
        /// Checker Approval: Final approval of the KYC.
        /// </summary>
        [HttpPost("checker/approve/{sessionId}")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<IActionResult> CheckerApprove(int sessionId)
        {
            var session = await _context.KycFormSessions.FindAsync(sessionId);
            if (session == null) return NotFound();

            session.FormStatus = 2; // Completed/Approved
            session.ModifiedDate = DateTime.Now;

            // Here we could also update the main ApplicationUser profile if needed

            await _context.SaveChangesAsync();
            return Ok(new { message = "KYC approved successfully." });
        }
    }
}
