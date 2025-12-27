// DTOs/ForgotPasswordDto.cs
// Data Transfer Objects for password reset functionality

namespace AUTHApi.DTOs
{
    /// <summary>
    /// DTO for initiating a password reset request
    /// Used when user enters their email on the forgot password page
    /// </summary>
    public class ForgotPasswordDto
    {
        public string? Email { get; set; }
    }

    /// <summary>
    /// DTO for completing the password reset
    /// Contains the reset token and the new password
    /// </summary>
    public class ResetPasswordDto
    {
        public string? Token { get; set; }
        public string? NewPassword { get; set; }
    }
}