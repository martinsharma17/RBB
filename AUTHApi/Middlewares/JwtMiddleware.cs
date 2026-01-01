using AUTHApi.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace AUTHApi.Middlewares;

/// <summary>
/// Middleware that attaches the full ApplicationUser entity to the HttpContext.
/// This runs after the standard JWT authentication middleware and enriches the context
/// with the full user object for downstream controllers to access.
/// </summary>
public class JwtMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<JwtMiddleware> _logger;

    public JwtMiddleware(RequestDelegate next, ILogger<JwtMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>
    /// Invoked for each request. Attaches user data if authenticated.
    /// </summary>
    public async Task Invoke(HttpContext context, UserManager<ApplicationUser> userManager)
    {
        // Only attempt to attach user if already authenticated by the JWT bearer middleware
        if (context.User.Identity?.IsAuthenticated == true)
        {
            await AttachUserToContext(context, userManager);
        }

        await _next(context);
    }

    /// <summary>
    /// Retrieves the full user entity from the database and attaches it to HttpContext.Items.
    /// This allows controllers to access the full user via context.Items["User"].
    /// </summary>
    private async Task AttachUserToContext(HttpContext context, UserManager<ApplicationUser> userManager)
    {
        try
        {
            // Extract the UserId from the ClaimsPrincipal
            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Fallback for some JWT configurations that might use "sub" or "id"
            if (string.IsNullOrEmpty(userId))
            {
                userId = context.User.FindFirst("sub")?.Value
                         ?? context.User.FindFirst("id")?.Value;
            }

            if (!string.IsNullOrEmpty(userId))
            {
                // Retrieve the full User entity from the database
                var user = await userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    context.Items["User"] = user;
                }
                else
                {
                    _logger.LogDebug("User with ID {UserId} not found in database", userId);
                }
            }
        }
        catch (Exception ex)
        {
            // Log the error but don't throw - the request can still proceed
            // but context.Items["User"] will be null
            _logger.LogWarning(ex, "Error attaching user to context");
        }
    }
}

