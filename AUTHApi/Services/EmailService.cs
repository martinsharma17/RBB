using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Mail;
using System.Threading.Tasks;

namespace AUTHApi.Services
{
    /// <summary>
    /// Service for sending emails including password reset and OTP verification emails.
    /// Uses SMTP configuration from appsettings.json.
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Sends an email asynchronously using SMTP configuration.
        /// Falls back to console simulation if SMTP is not configured.
        /// </summary>
        /// <param name="toEmail">Recipient email address</param>
        /// <param name="subject">Email subject line</param>
        /// <param name="body">HTML body content</param>
        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var smtpServer = _configuration["Email:SmtpServer"];
            var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            var smtpUser = _configuration["Email:SmtpUser"];
            var smtpPassword = _configuration["Email:SmtpPassword"];

            // If SMTP is not configured, log the email for development/testing purposes
            if (string.IsNullOrEmpty(smtpServer) || string.IsNullOrEmpty(smtpUser))
            {
                _logger.LogWarning(
                    "SMTP not configured. Email simulation - To: {ToEmail}, Subject: {Subject}",
                    toEmail, subject);
                _logger.LogDebug("Email body: {Body}", body);
                return;
            }

            try
            {
                using (var smtpClient = new SmtpClient(smtpServer, smtpPort)
                       {
                           EnableSsl = true,
                           Credentials = new System.Net.NetworkCredential(smtpUser, smtpPassword)
                       })
                {
                    using (var mailMessage = new MailMessage
                           {
                               From = new MailAddress(smtpUser, "User Management System"),
                               Subject = subject,
                               Body = body,
                               IsBodyHtml = true
                           })
                    {
                        mailMessage.To.Add(toEmail);
                        _logger.LogInformation("Sending email to {ToEmail}", toEmail);
                        await smtpClient.SendMailAsync(mailMessage);
                        _logger.LogDebug("Email sent successfully to {ToEmail}", toEmail);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {ToEmail}", toEmail);
                throw;
            }
        }

        /// <summary>
        /// Sends a password reset email with the provided reset link.
        /// </summary>
        /// <param name="email">User's email address</param>
        /// <param name="resetLink">Password reset link</param>
        public async Task SendPasswordResetEmailAsync(string email, string resetLink)
        {
            string subject = "Password Reset Request";
            string body = $@"
                <h2>Password Reset Request</h2>
                <p>You requested to reset your password. Click the link below to proceed:</p>
                <p><a href='{resetLink}'>Reset Password</a></p>
                <p>If you didn't request this, please ignore this email.</p>";

            // Log the reset link for development/debugging (only in non-production)
            _logger.LogDebug("Password reset link generated for {Email}: {ResetLink}", email, resetLink);

            await SendEmailAsync(email, subject, body);
        }

        /// <summary>
        /// Sends a KYC email verification link.
        /// </summary>
        public async Task SendKycVerificationEmailAsync(string email, string verificationLink)
        {
            string subject = "KYC Email Verification";
            string body = $@"
                <h2>Verify your Email for KYC</h2>
                <p>Please verify your email address to continue your KYC application.</p>
                <p><a href='{verificationLink}'>Verify Email</a></p>
                <p>If you didn't initiate this request, please ignore this email.</p>";

            _logger.LogDebug("KYC verification link generated for {Email}: {Link}", email, verificationLink);

            await SendEmailAsync(email, subject, body);
        }
    }
}
