using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using AUTHApi.Data;

namespace AUTHApi.Core.Security
{
    /// <summary>
    /// Custom authorization filter that allows EITHER:
    /// 1. Authenticated users (via JWT Bearer token) - typically staff members
    /// 2. Anonymous customers with valid dual-token credentials:
    ///    - SessionToken (GUID) in the route parameter
    ///    - VerificationToken in the 'X-KYC-Verification' HTTP header
    /// 
    /// This dual-token approach secures anonymous KYC sessions. Even if the SessionToken
    /// (visible in URL) is leaked, attackers cannot access the session without the
    /// VerificationToken (stored in localStorage and sent via HTTP headers).
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public class RequireKycSessionOrAuthAttribute : Attribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<RequireKycSessionOrAuthAttribute>>();

            // ==========================================
            // CASE 1: Authenticated User (JWT Token)
            // ==========================================
            // If the user is logged in (staff or authenticated customer), allow immediately.
            // This handles staff-assisted KYC flows and logged-in customer flows.
            if (user.Identity?.IsAuthenticated == true)
            {
                logger.LogDebug("Request authorized via JWT authentication for user: {UserId}", user.Identity.Name);
                return; // ✅ Allow - User is authenticated
            }

            // ==========================================
            // CASE 2: Anonymous Customer (Dual-Token)
            // ==========================================
            // For anonymous customers, we require BOTH tokens:
            // 1. SessionToken (from URL route parameter)
            // 2. VerificationToken (from HTTP header 'X-KYC-Verification')

            // Extract SessionToken from route parameters
            var sessionTokenStr = context.RouteData.Values["sessionToken"]?.ToString();
            if (string.IsNullOrEmpty(sessionTokenStr) || !Guid.TryParse(sessionTokenStr, out var sessionToken))
            {
                logger.LogWarning("Authorization failed: Missing or invalid sessionToken in route");
                context.Result = new UnauthorizedObjectResult(new
                {
                    success = false,
                    message = "Session identifier is missing or invalid"
                });
                return;
            }

            // Extract VerificationToken from HTTP headers
            var verificationToken = context.HttpContext.Request.Headers["X-KYC-Verification"].ToString();
            if (string.IsNullOrEmpty(verificationToken))
            {
                logger.LogWarning("Authorization failed: Missing X-KYC-Verification header for session {SessionToken}", sessionToken);
                context.Result = new UnauthorizedObjectResult(new
                {
                    success = false,
                    message = "Verification credentials are required. Please verify your email."
                });
                return;
            }

            // ==========================================
            // Database Validation
            // ==========================================
            // Verify that both tokens exist and match in the database
            var dbContext = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
            var session = dbContext.KycFormSessions
                .FirstOrDefault(s => s.SessionToken == sessionToken 
                                  && s.VerificationToken == verificationToken
                                  && s.EmailVerified == true);

            if (session == null)
            {
                logger.LogWarning("Authorization failed: Invalid token pair. SessionToken: {SessionToken}", sessionToken);
                context.Result = new UnauthorizedObjectResult(new
                {
                    success = false,
                    message = "Invalid session credentials. Please verify your email again."
                });
                return;
            }

            // ==========================================
            // Token Expiry Check
            // ==========================================
            // Ensure the verification token hasn't expired
            if (session.VerificationTokenExpiry.HasValue && session.VerificationTokenExpiry < DateTime.UtcNow)
            {
                logger.LogWarning("Authorization failed: Verification token expired for session {SessionToken}. Expired at: {ExpiryDate}", 
                    sessionToken, session.VerificationTokenExpiry);
                context.Result = new UnauthorizedObjectResult(new
                {
                    success = false,
                    message = "Your session has expired. Please verify your email again to continue."
                });
                return;
            }

            // ==========================================
            // Security Monitoring (IP/Device Change)
            // ==========================================
            // Log warnings if the request comes from a different IP or device
            // This doesn't block access but helps detect potential session hijacking
            var currentIp = context.HttpContext.Connection.RemoteIpAddress?.ToString();
            var currentUserAgent = context.HttpContext.Request.Headers["User-Agent"].ToString();

            if (!string.IsNullOrEmpty(session.VerifiedFromIp) && session.VerifiedFromIp != currentIp)
            {
                logger.LogWarning("Session {SessionToken} accessed from different IP. Original: {OriginalIp}, Current: {CurrentIp}",
                    sessionToken, session.VerifiedFromIp, currentIp);
                // Note: We log but don't block. You could add stricter validation here if needed.
            }

            if (!string.IsNullOrEmpty(session.VerifiedUserAgent) && session.VerifiedUserAgent != currentUserAgent)
            {
                logger.LogWarning("Session {SessionToken} accessed from different User-Agent. Original: {OriginalUA}, Current: {CurrentUA}",
                    sessionToken, session.VerifiedUserAgent?.Substring(0, Math.Min(50, session.VerifiedUserAgent.Length)), 
                    currentUserAgent?.Substring(0, Math.Min(50, currentUserAgent?.Length ?? 0)));
            }

            // ==========================================
            // Update Last Activity
            // ==========================================
            // Track session activity for analytics and security monitoring
            session.LastActivityDate = DateTime.UtcNow;
            dbContext.SaveChanges();

            logger.LogDebug("Request authorized via dual-token for anonymous session {SessionToken}", sessionToken);
            // ✅ All validations passed - Allow request
        }
    }
}
