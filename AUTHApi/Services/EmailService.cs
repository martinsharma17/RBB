// Services/EmailService.cs
// Implementation of email sending service

using Microsoft.Extensions.Configuration;

namespace AUTHApi.Services
{
    /// <summary>
    /// Email service implementation
    /// Currently uses console logging for development
    /// TODO: Replace with SMTP or SendGrid for production
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>
        /// Sends a password reset email
        /// DEVELOPMENT MODE: Logs to console
        /// PRODUCTION MODE: Should use SMTP/SendGrid (see comments below)
        /// </summary>
        public async Task SendPasswordResetEmailAsync(string email, string resetLink)
        {
            var smtpServer = _configuration["Email:SmtpServer"];
            var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            var smtpUser = _configuration["Email:SmtpUser"];
            var smtpPassword = _configuration["Email:SmtpPassword"];

            if (string.IsNullOrEmpty(smtpServer) || string.IsNullOrEmpty(smtpUser) || string.IsNullOrEmpty(smtpPassword))
            {
                // Fallback to console log if config is missing (safety net)
                Console.WriteLine("========================================");
                Console.WriteLine("📧 PASSWORD RESET EMAIL (SIMULATED - MISSING CONFIG)");
                Console.WriteLine($"To: {email}");
                Console.WriteLine($"Reset Link: {resetLink}");
                Console.WriteLine("========================================");
                return;
            }

            try
            {
                using var smtpClient = new System.Net.Mail.SmtpClient(smtpServer, smtpPort)
                {
                    EnableSsl = true,
                    Credentials = new System.Net.NetworkCredential(smtpUser, smtpPassword)
                };

                var mailMessage = new System.Net.Mail.MailMessage
                {
                    From = new System.Net.Mail.MailAddress(smtpUser, "User Management System"),
                    Subject = "Password Reset Request",
                    Body = $@"
                        <h2>Password Reset Request</h2>
                        <p>You requested to reset your password. Click the link below to proceed:</p>
                        <p><a href='{resetLink}'>Reset Password</a></p>
                        <p>If you didn't request this, please ignore this email.</p>",
                    IsBodyHtml = true
                };
                mailMessage.To.Add(email);

                await smtpClient.SendMailAsync(mailMessage);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending email: {ex.Message}");
                throw; // Re-throw so the controller knows it failed
            }
        }
    }
}
