// Services/IEmailService.cs
// Interface for email sending functionality

namespace AUTHApi.Services
{
    
    /// Email service interface for sending various types of emails
    /// Currently supports password reset emails, can be extended for other types
 
    public interface IEmailService
    {
        /// <summary>
        /// Sends a password reset email to the specified address
        /// </summary>
        /// <param name="email">Recipient's email address</param>
        /// <param name="resetLink">The password reset link to include in the email</param>
        /// <returns>Task representing the async operation</returns>
        Task SendPasswordResetEmailAsync(string email, string resetLink);
    }
}
