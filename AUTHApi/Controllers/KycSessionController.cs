using AUTHApi.Data;
using AUTHApi.DTOs;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AUTHApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KycSessionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public KycSessionController(ApplicationDbContext context)
        {
            _context = context;
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
                    IpAddress = model.IPAddress ?? Request.HttpContext.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = model.UserAgent,
                    DeviceFingerprint = model.DeviceFingerprint,
                    SessionExpiryDate = DateTime.Now.AddDays(30),
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

            return Ok(new KycSessionResponseDto
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
            var session = await _context.KycFormSessions.FindAsync(model.SessionId);
            if (session == null) return NotFound("Session not found");

            var oldOtps = await _context.KycOtpVerifications
                .Where(o => o.SessionId == model.SessionId && o.OtpType == model.OTPType && !o.IsExpired)
                .ToListAsync();

            foreach (var old in oldOtps) old.IsExpired = true;

            string otpCode = new Random().Next(100000, 999999).ToString();

            var otp = new KycOtpVerification
            {
                SessionId = session.Id,
                OtpType = model.OTPType,
                OtpCode = otpCode,
                SentToEmail = model.OTPType == 1 ? session.Email : null,
                SentToMobile = model.OTPType == 2 ? session.MobileNo : null,
                ExpiryDate = DateTime.Now.AddMinutes(10)
            };

            await _context.KycOtpVerifications.AddAsync(otp);
            await _context.SaveChangesAsync();

            return Ok(new { message = "OTP sent successfully", otpCode = otpCode, expiry = otp.ExpiryDate });
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto model)
        {
            var otp = await _context.KycOtpVerifications
                .Where(o => o.SessionId == model.SessionId && o.OtpType == model.OTPType &&
                            o.OtpCode == model.OTPCode && !o.IsExpired && !o.IsVerified &&
                            o.ExpiryDate > DateTime.Now)
                .OrderByDescending(o => o.CreatedDate)
                .FirstOrDefaultAsync();

            if (otp == null)
            {
                var activeOtp = await _context.KycOtpVerifications
                    .Where(o => o.SessionId == model.SessionId && o.OtpType == model.OTPType && !o.IsExpired)
                    .FirstOrDefaultAsync();

                if (activeOtp != null)
                {
                    activeOtp.AttemptCount++;
                    if (activeOtp.AttemptCount >= activeOtp.MaxAttempts) activeOtp.IsExpired = true;
                    await _context.SaveChangesAsync();
                }

                return BadRequest("Invalid or expired OTP");
            }

            otp.IsVerified = true;
            otp.VerifiedDate = DateTime.Now;

            var session = await _context.KycFormSessions.FindAsync(model.SessionId);
            if (session != null)
            {
                if (model.OTPType == 1)
                {
                    session.EmailVerified = true;
                    session.EmailVerifiedDate = DateTime.Now;
                }
                else if (model.OTPType == 2)
                {
                    session.MobileVerified = true;
                    session.MobileVerifiedDate = DateTime.Now;
                }

                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Verification successful", sessionId = model.SessionId });
        }

        [HttpGet("progress/{sessionId}")]
        public async Task<IActionResult> GetProgress(int sessionId)
        {
            var session = await _context.KycFormSessions
                .Include(s => s.StepCompletions)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null) return NotFound("Session not found");

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

            return Ok(response);
        }

        [HttpPost("complete-step")]
        public async Task<IActionResult> CompleteStep([FromBody] StepCompletionDto model)
        {
            var completion = await _context.KycStepCompletions
                .FirstOrDefaultAsync(sc => sc.SessionId == model.SessionId && sc.StepNumber == model.StepNumber);

            if (completion == null) return NotFound("Step tracking not found");

            completion.IsCompleted = true;
            completion.CompletedDate = DateTime.Now;
            completion.IsSaved = true;
            completion.SavedDate = DateTime.Now;
            if (model.RecordId.HasValue) completion.RecordId = model.RecordId;

            var session = await _context.KycFormSessions.FindAsync(model.SessionId);
            if (session != null)
            {
                session.LastSavedStep = model.StepNumber;
                session.CurrentStep = model.StepNumber + 1;
                session.LastActivityDate = DateTime.Now;

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
            return Ok(new { nextStep = model.StepNumber + 1 });
        }
    }

    public class StepCompletionDto
    {
        public int SessionId { get; set; }
        public int StepNumber { get; set; }
        public int? RecordId { get; set; }
    }
}
