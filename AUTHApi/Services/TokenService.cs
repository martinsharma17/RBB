using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AUTHApi.Services
{
    /// <summary>
    /// Service for generating JWT tokens with integrated permission claims.
    /// This centralizes the logic for both manual login and OAuth login.
    /// </summary>
    public interface ITokenService
    {
        Task<string> GenerateJwtToken(ApplicationUser user, string? picture = null);
    }

    public class TokenService : ITokenService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AUTHApi.Data.ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public TokenService(
            UserManager<ApplicationUser> userManager,
            AUTHApi.Data.ApplicationDbContext context,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _context = context;
            _configuration = configuration;
        }

        /// <summary>
        /// Generates a signed JWT for the user.
        /// Extracts roles and looks up associated granular permissions from the database.
        /// </summary>
        public async Task<string> GenerateJwtToken(ApplicationUser user, string? picture = null)
        {
            // 1. Get User Roles
            var roles = await _userManager.GetRolesAsync(user);
            
            // 2. Aggregate Permissions (Policies) from all Roles
            // We query RolePolicies joined with SystemPolicies to get the unique set of permission keys
            var permissions = await _context.RolePolicies
                .Where(rp => roles.Contains(_context.Roles.Where(r => r.Id == rp.RoleId).Select(r => r.Name).FirstOrDefault()!) && rp.IsGranted)
                .Select(rp => rp.Policy!.PolicyKey)
                .Distinct()
                .ToListAsync();

            // 3. Prepare standard and custom Claims
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, user.Name ?? string.Empty),
                new Claim(ClaimTypes.NameIdentifier, user.Id)
            };

            // Add profile picture if available (for Google OAuth)
            if (!string.IsNullOrEmpty(picture))
            {
                claims.Add(new Claim("picture", picture));
            }

            // 4. Inject Role Claims (for backward compatibility if needed)
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            // 5. Inject Permission Claims
            // These enable our policy-based [Authorize(Policy = "...")] checks
            foreach (var permission in permissions)
            {
                claims.Add(new Claim("Permission", permission));
            }

            // 6. Signing and Token Creation
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is missing.")));
            
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(int.Parse(_configuration["Jwt:ExpireMinutes"] ?? "1440")),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
