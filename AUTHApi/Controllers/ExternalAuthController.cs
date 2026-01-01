using AUTHApi.Entities;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Text.Json;
using System.Net.Http;
using Microsoft.Extensions.Logging;

namespace AUTHApi.Controllers
{
    /// <summary>
    /// Controller for handling external authentication providers (e.g., Google OAuth).
    /// Enables users to sign in using their Google accounts.
    /// </summary>
    [Route("api/auth")]
    [ApiController]
    public class ExternalAuthController : BaseApiController
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ExternalAuthController> _logger;
        private readonly string _frontendUrl;

        public ExternalAuthController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration configuration,
            ILogger<ExternalAuthController> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _logger = logger;
            _frontendUrl = configuration["Frontend:Url"] ?? "http://localhost:5173";
        }

        /// <summary>
        /// Initiates the Google OAuth login flow.
        /// Redirects the user to Google's authentication page.
        /// </summary>
        [HttpGet("google-login")]
        public IActionResult GoogleLogin()
        {
            var redirectUrl = Url.Action("GoogleResponse", "ExternalAuth", null, Request.Scheme);
            var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }

        /// <summary>
        /// Callback endpoint for Google OAuth authentication.
        /// Creates or retrieves user account and issues JWT token.
        /// </summary>
        [HttpGet("google-response")]
        public async Task<IActionResult> GoogleResponse()
        {
            var authenticateResult = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);

            if (!authenticateResult.Succeeded)
            {
                _logger.LogWarning("Google authentication failed");
                return Redirect($"{_frontendUrl}/login?error=Google+login+failed");
            }

            var email = authenticateResult.Principal.FindFirst(ClaimTypes.Email)?.Value;
            var name = authenticateResult.Principal.FindFirst(ClaimTypes.Name)?.Value;

            // Get Google profile picture - try multiple claim types
            var picture = authenticateResult.Principal.FindFirst("picture")?.Value;

            // Log for debugging in development
            _logger.LogDebug("Processing Google OAuth callback for email: {Email}", email);

            // If picture not found, try alternative claim types
            if (string.IsNullOrEmpty(picture))
            {
                picture = authenticateResult.Principal.FindFirst("urn:google:picture")?.Value
                          ?? authenticateResult.Principal
                              .FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/picture")?.Value;

                // Search through all claims for picture-related claims
                if (string.IsNullOrEmpty(picture))
                {
                    foreach (var claim in authenticateResult.Principal.Claims)
                    {
                        if (claim.Type.Contains("picture", StringComparison.OrdinalIgnoreCase) ||
                            claim.Type.Contains("image", StringComparison.OrdinalIgnoreCase) ||
                            claim.Type.Contains("photo", StringComparison.OrdinalIgnoreCase))
                        {
                            picture = claim.Value;
                            _logger.LogDebug("Found picture claim: {ClaimType}", claim.Type);
                            break;
                        }
                    }
                }
            }

            // If picture still not found, fetch from Google UserInfo endpoint
            if (string.IsNullOrEmpty(picture))
            {
                try
                {
                    var accessToken =
                        await HttpContext.GetTokenAsync(GoogleDefaults.AuthenticationScheme, "access_token");
                    if (!string.IsNullOrEmpty(accessToken))
                    {
                        using (var httpClient = new HttpClient())
                        {
                            httpClient.DefaultRequestHeaders.Authorization =
                                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
                            var response = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo");
                            if (response.IsSuccessStatusCode)
                            {
                                var json = await response.Content.ReadAsStringAsync();
                                var userInfo = JsonSerializer.Deserialize<JsonElement>(json);
                                if (userInfo.TryGetProperty("picture", out var pictureElement))
                                {
                                    picture = pictureElement.GetString();
                                    _logger.LogDebug("Retrieved picture from Google UserInfo API");
                                }

                                // Also update name if not already set
                                if (string.IsNullOrEmpty(name) && userInfo.TryGetProperty("name", out var nameElement))
                                {
                                    name = nameElement.GetString();
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to fetch user info from Google API");
                }
            }

            _logger.LogDebug("Google OAuth data extracted - Email: {Email}, Name: {Name}", email, name);

            if (string.IsNullOrEmpty(email))
            {
                _logger.LogWarning("No email received from Google OAuth");
                return Redirect($"{_frontendUrl}/login?error=No+email+from+Google");
            }

            // Find or create user
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    Name = name ?? email.Split('@')[0]
                };
                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                {
                    var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                    _logger.LogWarning("Failed to create user from Google OAuth: {Errors}", errors);
                    return Redirect($"{_frontendUrl}/login?error={Uri.EscapeDataString(errors)}");
                }

                _logger.LogInformation("Created new user from Google OAuth: {Email}", email);

                // Assign default role
                if (await _roleManager.RoleExistsAsync("User"))
                {
                    await _userManager.AddToRoleAsync(user, "User");
                }
            }
            else
            {
                // Update user's name if it's missing or if Google provides a better name
                if (string.IsNullOrEmpty(user.Name) && !string.IsNullOrEmpty(name))
                {
                    user.Name = name;
                    await _userManager.UpdateAsync(user);
                }
            }

            // Generate JWT token with Google picture
            var token = await GenerateJwtToken(user, picture);

            // Sign out the cookie auth to clean up
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            // Redirect with JWT to frontend
            return Redirect($"{_frontendUrl}/?token={Uri.EscapeDataString(token)}");
        }

        /// <summary>
        /// Generates a JWT token for the authenticated user with optional picture claim.
        /// </summary>
        /// <param name="user">The authenticated user</param>
        /// <param name="picture">Optional profile picture URL from OAuth provider</param>
        /// <returns>Signed JWT token string</returns>
        private async Task<string> GenerateJwtToken(ApplicationUser user, string? picture = null)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var userClaims = await _userManager.GetClaimsAsync(user);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, user.Name ?? string.Empty),
                new Claim(ClaimTypes.NameIdentifier, user.Id)
            };

            // Add Google profile picture if available
            if (!string.IsNullOrEmpty(picture))
            {
                claims.Add(new Claim("picture", picture));
            }

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            foreach (var claim in userClaims)
            {
                claims.Add(claim);
            }

            var key = new SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(
                    _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured")));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(int.Parse(_configuration["Jwt:ExpireMinutes"] ?? "60")),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}