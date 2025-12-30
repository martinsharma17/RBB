using AUTHApi.Entities;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace AUTHApi.Middlewares;

public class JwtMiddleware
{
    private readonly RequestDelegate _next;

    public JwtMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context, UserManager<ApplicationUser> userManager)
    {
        // 1. Check if the user is already authenticated by the framework (JwtBearerDefaults)
        // This avoids manually re-validating the token and repeating the logic in Program.cs
        if (context.User.Identity?.IsAuthenticated == true)
        {
            await AttachUserToContext(context, userManager);
        }

        await _next(context);
    }

    private async Task AttachUserToContext(HttpContext context, UserManager<ApplicationUser> userManager)
    {
        try
        {
            // 2. Extract the NameIdentifier (UserId) from the ClaimsPrincipal
            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Fallback for some JWT configurations that might use "sub" or "id"
            if (string.IsNullOrEmpty(userId))
            {
                userId = context.User.FindFirst("sub")?.Value
                         ?? context.User.FindFirst("id")?.Value;
            }

            if (!string.IsNullOrEmpty(userId))
            {
                // 3. Retrieve the full User entity from the database
                // This allows downstream controllers to access the full user profile via context.Items["User"]
                // without querying the database again.
                var user = await userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    context.Items["User"] = user;
                }
            }
        }
        catch
        {
            // Do not throw exceptions here; just continue.
            // If the user can't be found or something fails, the request proceeds 
            // but context.Items["User"] will be null.
        }
    }
}
