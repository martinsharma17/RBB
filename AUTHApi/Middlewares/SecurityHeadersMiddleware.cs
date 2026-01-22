using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace AUTHApi.Middlewares
{
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // 1. HSTS (Strict-Transport-Security)
            if (context.Request.IsHttps)
            {
                context.Response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
            }

            // 2. X-Frame-Options (Clickjacking protection)
            context.Response.Headers.Add("X-Frame-Options", "DENY");

            // 3. X-Content-Type-Options (MIME sniffing protection)
            context.Response.Headers.Add("X-Content-Type-Options", "nosniff");

            // 4. Content-Security-Policy (CSP)
            // Note: Adjust these values based on your frontend needs
            context.Response.Headers.Add("Content-Security-Policy", 
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "font-src 'self' https://fonts.gstatic.com; " +
                "img-src 'self' data: blob:; " +
                "frame-ancestors 'none'; " +
                "connect-src 'self' http://localhost:* https://localhost:*");

            // 5. Referrer-Policy
            context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");

            // 6. Permissions-Policy (Feature-Policy)
            context.Response.Headers.Add("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

            await _next(context);
        }
    }
}
