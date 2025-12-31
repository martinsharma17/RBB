using Microsoft.Extensions.Configuration;
using System;
using System.Net.Mail;
using System.Threading.Tasks;

namespace AUTHApi.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var smtpServer = _configuration["Email:SmtpServer"];
            var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            var smtpUser = _configuration["Email:SmtpUser"];
            var smtpPassword = _configuration["Email:SmtpPassword"];

            if (string.IsNullOrEmpty(smtpServer) || string.IsNullOrEmpty(smtpUser))
            {
                Console.WriteLine("========================================");
                Console.WriteLine($"📧 EMAIL SIMULATION (To: {toEmail})");
                Console.WriteLine($"Subject: {subject}");
                Console.WriteLine($"Body: {body}");
                Console.WriteLine("========================================");
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
                        Console.WriteLine($"📧 Sending email to {toEmail}...");
                        await smtpClient.SendMailAsync(mailMessage);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending email: {ex.Message}");
                throw;
            }
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetLink)
        {
            string subject = "Password Reset Request";
            string body = $@"
                <h2>Password Reset Request</h2>
                <p>You requested to reset your password. Click the link below to proceed:</p>
                <p><a href='{resetLink}'>Reset Password</a></p>
                <p>If you didn't request this, please ignore this email.</p>";

            // Log to console for development testing
            Console.WriteLine("========================================");
            Console.WriteLine("📧 PASSWORD RESET LINK GENERATED");
            Console.WriteLine($"To: {email}");
            Console.WriteLine($"Reset Link: {resetLink}");
            Console.WriteLine("========================================");

            await SendEmailAsync(email, subject, body);
        }
    }
}
