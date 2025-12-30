// Controllers/PasswordResetController.cs
// Handles password reset functionality (forgot password flow)

using AUTHApi.DTOs;
using AUTHApi.Entities;
using AUTHApi.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AUTHApi.Controllers
{
    /// <summary>
    /// Controller for handling password reset operations
    /// Implements a secure token-based password reset flow
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PasswordResetController : BaseApiController
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public PasswordResetController(
            UserManager<ApplicationUser> userManager,
            IEmailService emailService,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _emailService = emailService;
            _configuration = configuration;
        }

        // ============================================================================
        // STEP 1: User requests password reset by providing their email
        // ============================================================================
        /// <summary>
        /// Initiates the password reset process
        /// Generates a reset token and sends it via email
        /// </summary>
        /// <param name="dto">Contains the user's email address</param>
        /// <returns>Generic success message (doesn't reveal if email exists)</returns>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            // SECURITY NOTE: We always return the same message regardless of whether
            // the email exists or not. This prevents attackers from using this endpoint
            // to discover which emails are registered in the system.

            var user = await _userManager.FindByEmailAsync(dto.Email);

            // If user doesn't exist, still return success (security best practice)
            if (user == null)
            {
                return Success("If your email is registered, you will receive a password reset link shortly.");
            }

            // Generate a password reset token using ASP.NET Identity
            // This token is:
            // 1. Unique to this user
            // 2. One-time use only
            // 3. Expires after a set time (default: 24 hours)
            // 4. Cannot be guessed or forged
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            // Construct the reset link
            // This will direct the user to the frontend reset password page
            var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
            var resetLink =
                $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email)}";

            // Send the email with the reset link
            await _emailService.SendPasswordResetEmailAsync(user.Email, resetLink);

            // Return generic success message
            return Success("If your email is registered, you will receive a password reset link shortly.");
        }

        // ============================================================================
        // STEP 2: Verify that the reset token is valid (optional but recommended)
        // ============================================================================
        /// <summary>
        /// Validates a password reset token without consuming it
        /// Useful for showing appropriate UI before the user submits new password
        /// </summary>
        /// <param name="email">User's email address</param>
        /// <param name="token">The reset token from the email link</param>
        /// <returns>Indicates whether the token is valid</returns>
        [HttpGet("verify-token")]
        public async Task<IActionResult> VerifyToken([FromQuery] string email, [FromQuery] string token)
        {
            // Find the user
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return Failure("Invalid or expired reset link", 400, new { valid = false });
            }

            // Verify the token is valid
            // This uses ASP.NET Identity's built-in token validation
            var isValid = await _userManager.VerifyUserTokenAsync(
                user,
                _userManager.Options.Tokens.PasswordResetTokenProvider,
                "ResetPassword",
                token
            );

            if (isValid)
            {
                return Success(new { valid = true }, "Token is valid");
            }
            else
            {
                return Failure("Invalid or expired reset link. Please request a new one.", 400, new { valid = false });
            }
        }

        // ============================================================================
        // STEP 3: User submits new password with the reset token
        // ============================================================================
        /// <summary>
        /// Completes the password reset process
        /// Uses the token to verify the request and sets the new password
        /// </summary>
        /// <param name="email">User's email address (from query string)</param>
        /// <param name="dto">Contains the reset token and new password</param>
        /// <returns>Success or error message</returns>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(
            [FromQuery] string email,
            [FromBody] ResetPasswordDto dto)
        {
            // Find the user by email
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return Failure("Invalid reset request. Please try again.");
            }

            // Reset the password using the token
            // ASP.NET Identity will:
            // 1. Verify the token is valid
            // 2. Check the token hasn't been used before
            // 3. Check the token hasn't expired
            // 4. Update the password if all checks pass
            var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);

            if (result.Succeeded)
            {
                // Password reset successful!
                // The user can now login with their new password
                return Success("Password has been reset successfully. You can now login with your new password.");
            }

            // If we get here, something went wrong
            // Common reasons:
            // - Token expired (> 24 hours old)
            // - Token already used
            // - Token invalid/tampered with
            // - New password doesn't meet requirements
            var errors = result.Errors.Select(e => e.Description).ToList();

            return Failure("Failed to reset password", 400, errors);
        }

        // ============================================================================
        // OPTIONAL: Request password reset status/history (for admin purposes)
        // ============================================================================
        /// <summary>
        /// [OPTIONAL] Check if a user has any pending password reset requests
        /// This is useful for admin/support purposes
        /// </summary>
        [HttpGet("reset-status/{email}")]
        public async Task<IActionResult> GetResetStatus(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                return Failure("User not found", 404);
            }

            // You could extend this to track reset history in a database table
            // For now, we just confirm the user exists
            return Success(new { email = user.Email }, "User exists and can request password reset");
        }
    }
}
