using AUTHApi.Data;
using AUTHApi.DTOs;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AUTHApi.Services;
using Microsoft.Extensions.Logging;

namespace AUTHApi.Controllers
{
    /// <summary>
    /// Controller for user authentication management (Register, Login, Logout).
    /// This controller exposes public endpoints that do not require valid tokens (except Logout).
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class UserAuthController : BaseApiController
    {
        // ==========================================
        // DEPENDENCY INJECTION
        // ==========================================
        // These services are provided by ASP.NET Core Identity and Configuration system.

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signinManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly ILogger<UserAuthController> _logger;
        private readonly ITokenService _tokenService;

        // JWT Configuration values read from appsettings.json
        private readonly string? _jwtKey;
        private readonly string? _JwtIssuer;
        private readonly string? _JwtAudience;
        private readonly int _JwtExpiry;
        private readonly IConfiguration _configuration;

        public UserAuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            RoleManager<ApplicationRole> roleManager,
            IConfiguration configuration,
            ILogger<UserAuthController> logger,
            ITokenService tokenService)
        {
            _userManager = userManager;
            _signinManager = signInManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _logger = logger;
            _tokenService = tokenService;

            // Read JWT settings from configuration (never hardcode secrets!)
            _jwtKey = configuration["Jwt:Key"];
            _JwtIssuer = configuration["Jwt:Issuer"];
            _JwtAudience = configuration["Jwt:Audience"];
            _JwtExpiry = int.Parse(configuration["Jwt:ExpireMinutes"] ?? "1440");
        }


        /// <summary>
        /// Registers a new user in the system.
        /// Endpoint: POST /api/UserAuth/Register
        /// </summary>
        /// <param name="registerModel">JSON object containing Name, Email, Password</param>
        /// <returns>Success message or error list</returns>
        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel registerModel)
        {
            // 1. Input Validation
            if (registerModel == null
                || string.IsNullOrEmpty(registerModel.Name)
                || string.IsNullOrEmpty(registerModel.Email)
                || string.IsNullOrEmpty(registerModel.Password))
            {
                return Failure("Invalid client request. Missing required fields.");
            }

            // 2. Check for existing user
            var existingUser = await _userManager.FindByEmailAsync(registerModel.Email);
            if (existingUser != null)
            {
                return Failure("User with this email already exists.");
            }

            // 3. Create ApplicationUser instance
            var user = new ApplicationUser
            {
                UserName = registerModel.Email, // Identity uses UserName for login usually, we use Email
                Email = registerModel.Email,
                Name = registerModel.Name
            };

            // 4. Save user to database using UserManager
            // This hashes the password automatically before saving
            var result = await _userManager.CreateAsync(user, registerModel.Password);

            if (result.Succeeded)
            {
                // 5. Default Role Assignment
                // In a dynamic system, we may avoid hardcoding "User". 
                // Roles can be assigned later or managed via a configurable default.
                // await _userManager.AddToRoleAsync(user, "User");

                return Success("User registered successfully");
            }
            else
            {
                // Return detailed errors (e.g., password too weak)
                return Failure("User registration failed", 400, result.Errors);
            }
        }

        /// <summary>
        /// Authenticates a user and returns a JWT Token.
        /// Endpoint: POST /api/UserAuth/Login
        /// </summary>
        /// <param name="loginModel">JSON object containing Email and Password</param>
        /// <returns>JWT Token and User Roles</returns>
        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginModel loginModel)
        {
            // 1. Find user by email
            var user = await _userManager.FindByEmailAsync(loginModel.Email);
            if (user == null)
            {
                return Failure("Invalid email or password", 401);
            }

            // 2. Verify password
            // false parameter indicates we don't want to lock out the account after failed attempts here
            var result = await _signinManager.CheckPasswordSignInAsync(user, loginModel.Password, false);

            if (!result.Succeeded)
            {
                return Failure("Invalid email or password", 401);
            }

            // 3. Check Account Status (IsActive)
            // EXEMPT SuperAdmin from this check to ensure they can never be locked out.
            var userRoles = await _userManager.GetRolesAsync(user);
            bool isSuperAdmin = userRoles.Contains("SuperAdmin") ||
                                user.Email.Equals("martinsharma18@gmail.com", StringComparison.OrdinalIgnoreCase);

            if (!isSuperAdmin)
            {
                // Only check IsActive for non-SuperAdmins
                if (!user.IsActive)
                {
                    return Failure("Admin blocked you", 401);
                }
            }
            else
            {
                // Force Ensure Active for SuperAdmin
                if (!user.IsActive)
                {
                    user.IsActive = true;
                    await _userManager.UpdateAsync(user);
                }
            }

            // 4. Generate JWT Token
            // This token now contains granular Permission claims instead of just Roles.
            var token = await _tokenService.GenerateJwtToken(user);

            // 5. Get Roles for frontend (so frontend knows what UI to show)
            var roles = await _userManager.GetRolesAsync(user);

            return Success(new { token = token, roles = roles });
        }

        /// <summary>
        /// Signs out the current user (Valid for Cookie schemes, less relevant for purely stateless JWT).
        /// Endpoint: POST /api/UserAuth/Logout
        /// </summary>
        [HttpPost("Logout")]
        public async Task<IActionResult> Logout()
        {
            await _signinManager.SignOutAsync();
            return Success("User logged out successfully");
        }


        // ============================================================================
        // PASSWORD RESET ENDPOINTS
        // ============================================================================

        /// <summary>
        /// Initiates the password reset process.
        /// Endpoint: POST /api/UserAuth/forgot-password
        /// </summary>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto model,
            [FromServices] IEmailService emailService)
        {
            if (model == null || string.IsNullOrEmpty(model.Email))
                return Failure("Email is required.");

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                // Don't reveal user doesn't exist
                return Success("If your email is registered, you will receive a password reset link.");
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            // Build the frontend URL
            var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
            var resetLink =
                $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email)}";

            try
            {
                await emailService.SendPasswordResetEmailAsync(user.Email, resetLink);
                return Success("If your email is registered, you will receive a password reset link.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {Email}", model.Email);
                return Failure("Failed to send email. Please try again later.", 500);
            }
        }

        /// <summary>
        /// Verifies a password reset token.
        /// Endpoint: GET /api/UserAuth/verify-token
        /// </summary>
        [HttpGet("verify-token")]
        public async Task<IActionResult> VerifyToken([FromQuery] string email, [FromQuery] string token)
        {
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(token))
                return Failure("Invalid request");

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return Success(new { valid = false },
                    "Invalid token"); // User not found effectively means token invalid for this context

            var isValid = await _userManager.VerifyUserTokenAsync(user,
                _userManager.Options.Tokens.PasswordResetTokenProvider, "ResetPassword", token);

            return Success(new { valid = isValid });
        }

        /// <summary>
        /// Resets the password using the token.
        /// Endpoint: POST /api/UserAuth/reset-password
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromQuery] string email, [FromBody] ResetPasswordDto model)
        {
            if (model == null || string.IsNullOrEmpty(model.Token) || string.IsNullOrEmpty(model.NewPassword) ||
                string.IsNullOrEmpty(email))
                return Failure("Invalid request");

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return Failure("Invalid request");

            var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);

            if (result.Succeeded)
            {
                return Success("Password has been reset successfully.");
            }

            var errors = result.Errors.Select(e => e.Description).ToList();
            return Failure("Failed to reset password", 400, errors);
        }
    }
}
