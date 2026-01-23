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
            KycFormSession? session = null;

            if (!model.ForceNew)
            {
                session = await _context.KycFormSessions
                    .FirstOrDefaultAsync(s => s.Email == model.Email && !s.IsExpired && s.FormStatus < 3);
            }

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

                // Check if this email is already verified in another ACTIVE session
                // This allows "Start New Application" to skip OTP if already done recently
                var isAlreadyVerified = await _context.KycFormSessions
                    .AnyAsync(s => s.Email == model.Email && s.EmailVerified && !s.IsExpired);

                if (isAlreadyVerified)
                {
                    session.EmailVerified = true;
                    session.EmailVerifiedDate = DateTime.UtcNow;
                }

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

        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] VerifyOtpDto model)
        {
            var session = await _context.KycFormSessions.FirstOrDefaultAsync(s => s.SessionToken == model.SessionToken);
            if (session == null) return Failure("Session not found", 404);

            if (model.OtpType == 1 && !string.IsNullOrWhiteSpace(model.Email) &&
                !session.Email.Equals(model.Email, StringComparison.OrdinalIgnoreCase))
            {
                session.Email = model.Email;
                session.EmailVerified = false;
                await _context.SaveChangesAsync();
            }

            var oldOtps = await _context.KycOtpVerifications
                .Where(o => o.SessionId == session.Id && o.OtpType == model.OtpType && !o.IsExpired)
                .ToListAsync();

            foreach (var old in oldOtps) old.IsExpired = true;

            string otpCode = new Random().Next(100000, 999999).ToString();
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

            if (model.OtpType == 1 && !string.IsNullOrEmpty(sentToEmail))
            {
                string subject = "Your KYC Verification OTP";
                string body = $@"<h3>KYC Verification</h3><p>Your OTP code is: <strong>{otpCode}</strong></p><p>Expires in 10 mins.</p>";
                await _emailService.SendEmailAsync(sentToEmail, subject, body);
            }

            return Success(new { otpCode, expiry = otp.ExpiryDate }, "OTP sent");
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto model)
        {
            /* COMMENTED FOR DEV BYPASS
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
            */

            var session = await _context.KycFormSessions.FirstOrDefaultAsync(s => s.SessionToken == model.SessionToken);
            if (session != null)
            {
                if (model.OtpType == 1)
                {
                    session.EmailVerified = true;
                    session.EmailVerifiedDate = DateTime.UtcNow;

                    // ==========================================
                    // DUAL-TOKEN SECURITY: Generate Verification Token
                    // ==========================================
                    // After successful email verification, generate a short verification token
                    // that will be required in the HTTP header 'X-KYC-Verification' for all
                    // future API calls. This prevents URL-based session hijacking.
                    
                    // Generate 16-character verification token (using first 16 chars of GUID)
                    session.VerificationToken = Guid.NewGuid().ToString("N").Substring(0, 16);
                    
                    // Set expiration to 48 hours from now
                    session.VerificationTokenExpiry = DateTime.UtcNow.AddHours(24);
                    
                    // Capture IP address for security monitoring
                    session.VerifiedFromIp = HttpContext.Connection.RemoteIpAddress?.ToString();
                    
                    // Capture User-Agent for device fingerprinting
                    session.VerifiedUserAgent = Request.Headers["User-Agent"].ToString();
                }
                else if (model.OtpType == 2)
                {
                    session.MobileVerified = true;
                    session.MobileVerifiedDate = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
            }

            // After successful verification, find ALL active sessions for this email
            var email = session?.Email; // ?? otp.SentToEmail;
            var availableSessions = await _context.KycFormSessions
                .Where(s => s.Email == session.Email && !s.IsExpired)
                .OrderByDescending(s => s.CreatedDate)
                .Select(s => new KycSessionBriefDto
                {
                    SessionId = s.Id,
                    SessionToken = s.SessionToken,
                    CreatedDate = s.CreatedDate,
                    CurrentStep = s.CurrentStep,
                    LastSavedStep = s.LastSavedStep,
                    FormStatus = s.FormStatus
                })
                .ToListAsync();

            // Return BOTH tokens to the frontend
            // - SessionToken: Goes in URL route parameters
            // - VerificationToken: Goes in HTTP header 'X-KYC-Verification'
            return Success(new VerifyOtpResponseDto
            {
                Success = true,
                SessionToken = model.SessionToken,
                VerificationToken = session?.VerificationToken, // NEW: Return verification token
                TokenExpiry = session?.VerificationTokenExpiry,  // NEW: Return expiry timestamp
                AvailableSessions = availableSessions
            }, "Verification successful");
        }

        [HttpGet("progress/{sessionToken}")]
        public async Task<IActionResult> GetProgress(Guid sessionToken)
        {
            var session = await _context.KycFormSessions
                .Include(s => s.StepCompletions)
                .FirstOrDefaultAsync(s => s.SessionToken == sessionToken);

            if (session == null) return Failure("Session not found", 404);

            var stepsMaster = await _context.KycFormSteps.OrderBy(s => s.DisplayOrder).ToListAsync();

            return Success(new KycProgressDto
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
            });
        }

        [HttpPost("complete-step")]
        public async Task<IActionResult> CompleteStep([FromBody] StepCompletionDto model)
        {
            var session = await _context.KycFormSessions.FirstOrDefaultAsync(s => s.SessionToken == model.SessionToken);
            if (session == null) return Failure("Session not found", 404);

            var completion = await _context.KycStepCompletions
                .FirstOrDefaultAsync(sc => sc.SessionId == session.Id && sc.StepNumber == model.StepNumber);

            if (completion == null) return Failure("Step not found", 404);

            completion.IsCompleted = true;
            completion.CompletedDate = DateTime.UtcNow;
            completion.IsSaved = true;
            completion.SavedDate = DateTime.UtcNow;
            if (model.RecordId.HasValue) completion.RecordId = model.RecordId;

            session.LastSavedStep = model.StepNumber;
            session.CurrentStep = model.StepNumber + 1;
            session.LastActivityDate = DateTime.UtcNow;

            var requiredSteps = await _context.KycFormSteps.Where(s => s.IsRequired).Select(s => s.StepNumber).ToListAsync();
            var completedRequired = await _context.KycStepCompletions
                .CountAsync(sc => sc.SessionId == session.Id && sc.IsCompleted && requiredSteps.Contains(sc.StepNumber));

            if (completedRequired >= requiredSteps.Count) session.FormStatus = 2;

            await _context.SaveChangesAsync();
            return Success(new { nextStep = model.StepNumber + 1 });
        }

        [HttpGet("list-by-email")]
        public async Task<IActionResult> ListSessionsByEmail([FromQuery] string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return Failure("Email required", 400);

            var availableSessions = await _context.KycFormSessions
                .Where(s => s.Email == email && !s.IsExpired)
                .OrderByDescending(s => s.CreatedDate)
                .Select(s => new KycSessionBriefDto
                {
                    SessionId = s.Id,
                    SessionToken = s.SessionToken,
                    CreatedDate = s.CreatedDate,
                    CurrentStep = s.CurrentStep,
                    LastSavedStep = s.LastSavedStep,
                    FormStatus = s.FormStatus
                })
                .ToListAsync();

            return Success(availableSessions);
        }

        [HttpDelete("{sessionToken}")]
        public async Task<IActionResult> DeleteSession(Guid sessionToken)
        {
            var session = await _context.KycFormSessions
                .Include(s => s.KycDetail)
                .FirstOrDefaultAsync(s => s.SessionToken == sessionToken);

            if (session == null) return Failure("Session not found", 404);

            if (session.FormStatus >= 3) return Failure("Cannot delete submitted KYC.");

            if (session.KycDetail != null) _context.KycDetails.Remove(session.KycDetail);
            _context.KycFormSessions.Remove(session);

            await _context.SaveChangesAsync();
            return Success(true, "Session deleted");
        }
    }
}
