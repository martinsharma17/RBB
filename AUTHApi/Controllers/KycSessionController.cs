using AUTHApi.Data;
using AUTHApi.DTOs;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AUTHApi.Services;

namespace AUTHApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KycSessionController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public KycSessionController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpPost("initialize")]
        public async Task<IActionResult> InitializeSession([FromBody] KycInitializeDto model)
        {
            var session = await _context.KycFormSessions
                .FirstOrDefaultAsync(s => s.Email == model.Email && !s.IsExpired);

            if (session == null)
            {
                session = new KycFormSession
                {
                    Email = model.Email,
                    MobileNo = model.MobileNo,
                    IpAddress = model.IpAddress ?? Request.HttpContext.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = model.UserAgent,
                    DeviceFingerprint = model.DeviceFingerprint,
                    SessionExpiryDate = DateTime.UtcNow.AddDays(30),
                    CurrentStep = 1,
                    LastSavedStep = 0
                };

                await _context.KycFormSessions.AddAsync(session);
                await _context.SaveChangesAsync();

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

            return Success(new KycSessionResponseDto
            {
                SessionId = session.Id,
                SessionToken = session.SessionToken,
                Email = session.Email,
                EmailVerified = session.EmailVerified,
                CurrentStep = session.CurrentStep,
                LastSavedStep = session.LastSavedStep,
                FormStatus = session.FormStatus
            });
        }

        /// <summary>
        /// Sends an OTP (One-Time Password) for email verification.
        /// If a new email is provided in the model, it updates the session email before sending.
        /// </summary>
        /// <param name="model">DTO containing session ID and OTP type (1=Email).</param>
        /// <returns>Success message with OTP code (for dev/test) and expiry.</returns>
        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] VerifyOtpDto model)
        {
            var session = await _context.KycFormSessions.FindAsync(model.SessionId);
            if (session == null) return Failure("Session not found", 404);

            // Update session email if a new one is provided and different from existing
            // This handles cases where user entered a typo initially or wants to change email
            if (model.OtpType == 1 && !string.IsNullOrWhiteSpace(model.Email) &&
                !session.Email.Equals(model.Email, StringComparison.OrdinalIgnoreCase))
            {
                session.Email = model.Email;
                // Reset verification status if email changes
                session.EmailVerified = false;
                await _context.SaveChangesAsync();
            }

            // Invalidate any existing active OTPs of the same type for this session
            var oldOtps = await _context.KycOtpVerifications
                .Where(o => o.SessionId == model.SessionId && o.OtpType == model.OtpType && !o.IsExpired)
                .ToListAsync();

            foreach (var old in oldOtps) old.IsExpired = true;

            string otpCode = new Random().Next(100000, 999999).ToString();

            // Determine target for OTP based on type
            string? sentToEmail = model.OtpType == 1 ? session.Email : null;
            string? sentToMobile = model.OtpType == 2 ? session.MobileNo : null;

            var otp = new KycOtpVerification
            {
                SessionId = session.Id,
                OtpType = (byte)model.OtpType,
                OtpCode = otpCode,
                SentToEmail = sentToEmail,
                SentToMobile = sentToMobile,
                ExpiryDate = DateTime.UtcNow.AddMinutes(10)
            };

            await _context.KycOtpVerifications.AddAsync(otp);
            await _context.SaveChangesAsync();

            // Send actual email if type is email
            if (model.OtpType == 1 && !string.IsNullOrEmpty(sentToEmail))
            {
                string subject = "Your KYC Verification OTP";
                string body = $@"
                    <h3>KYC Verification</h3>
                    <p>Your OTP code for email verification is: <strong>{otpCode}</strong></p>
                    <p>This code will expire in 10 minutes.</p>";
                await _emailService.SendEmailAsync(sentToEmail, subject, body);
            }

            return Success(new { otpCode, expiry = otp.ExpiryDate }, "OTP sent successfully");
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto model)
        {
            var otp = await _context.KycOtpVerifications
                .Where(o => o.SessionId == model.SessionId && o.OtpType == model.OtpType &&
                            o.OtpCode == model.OtpCode && !o.IsExpired && !o.IsVerified &&
                            o.ExpiryDate > DateTime.UtcNow)
                .OrderByDescending(o => o.CreatedDate)
                .FirstOrDefaultAsync();

            if (otp == null)
            {
                var activeOtp = await _context.KycOtpVerifications
                    .Where(o => o.SessionId == model.SessionId && o.OtpType == model.OtpType && !o.IsExpired)
                    .FirstOrDefaultAsync();

                if (activeOtp != null)
                {
                    activeOtp.AttemptCount++;
                    if (activeOtp.AttemptCount >= activeOtp.MaxAttempts) activeOtp.IsExpired = true;
                    await _context.SaveChangesAsync();
                }

                return Failure("Invalid or expired OTP");
            }

            otp.IsVerified = true;
            otp.VerifiedDate = DateTime.UtcNow;

            var session = await _context.KycFormSessions.FindAsync(model.SessionId);
            if (session != null)
            {
                if (model.OtpType == 1)
                {
                    session.EmailVerified = true;
                    session.EmailVerifiedDate = DateTime.UtcNow;
                }
                else if (model.OtpType == 2)
                {
                    session.MobileVerified = true;
                    session.MobileVerifiedDate = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
            }

            return Success(new { sessionId = model.SessionId }, "Verification successful");
        }

        [HttpGet("progress/{sessionId}")]
        public async Task<IActionResult> GetProgress(int sessionId)
        {
            var session = await _context.KycFormSessions
                .Include(s => s.StepCompletions)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null) return Failure("Session not found", 404);

            var stepsMaster = await _context.KycFormSteps.OrderBy(s => s.DisplayOrder).ToListAsync();

            var response = new KycProgressDto
            {
                Session = new KycSessionResponseDto
                {
                    SessionId = session.Id,
                    SessionToken = session.SessionToken,
                    Email = session.Email,
                    EmailVerified = session.EmailVerified,
                    CurrentStep = session.CurrentStep,
                    LastSavedStep = session.LastSavedStep,
                    FormStatus = session.FormStatus
                },
                Steps = stepsMaster.Select(m =>
                {
                    var completion = session.StepCompletions.FirstOrDefault(sc => sc.StepNumber == m.StepNumber);
                    return new StepStatusDto
                    {
                        StepNumber = m.StepNumber,
                        StepName = m.StepName,
                        StepNameNepali = m.StepNameNepali,
                        IsCompleted = completion?.IsCompleted ?? false,
                        IsSaved = completion?.IsSaved ?? false,
                        SavedDate = completion?.SavedDate,
                        RecordId = completion?.RecordId,
                        IsRequired = m.IsRequired
                    };
                }).ToList()
            };

            return Success(response);
        }

        [HttpPost("complete-step")]
        public async Task<IActionResult> CompleteStep([FromBody] StepCompletionDto model)
        {
            var completion = await _context.KycStepCompletions
                .FirstOrDefaultAsync(sc => sc.SessionId == model.SessionId && sc.StepNumber == model.StepNumber);

            if (completion == null) return Failure("Step tracking not found", 404);

            completion.IsCompleted = true;
            completion.CompletedDate = DateTime.UtcNow;
            completion.IsSaved = true;
            completion.SavedDate = DateTime.UtcNow;
            if (model.RecordId.HasValue) completion.RecordId = model.RecordId;

            var session = await _context.KycFormSessions.FindAsync(model.SessionId);
            if (session != null)
            {
                session.LastSavedStep = model.StepNumber;
                session.CurrentStep = model.StepNumber + 1;
                session.LastActivityDate = DateTime.UtcNow;

                var requiredSteps = await _context.KycFormSteps.Where(s => s.IsRequired).Select(s => s.StepNumber)
                    .ToListAsync();
                var completedRequired = await _context.KycStepCompletions
                    .Where(sc =>
                        sc.SessionId == model.SessionId && sc.IsCompleted && requiredSteps.Contains(sc.StepNumber))
                    .CountAsync();

                if (completedRequired >= requiredSteps.Count)
                {
                    session.FormStatus = 2;
                }
            }

            await _context.SaveChangesAsync();
            return Success(new { nextStep = model.StepNumber + 1 });
        }
    }

    public class StepCompletionDto
    {
        public int SessionId { get; set; }
        public int StepNumber { get; set; }
        public int? RecordId { get; set; }
    }
}
