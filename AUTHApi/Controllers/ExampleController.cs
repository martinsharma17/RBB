using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AUTHApi.Controllers
{

    /// Example controller demonstrating Role-Based and Policy-Based Authorization
    /// Base URL: /api/Example

    [Route("api/[controller]")]
    [ApiController]
    public class ExampleController : ControllerBase
    {

        /// EXAMPLE 1: No authorization required (public endpoint)
        /// GET /api/Example/Public
        /// Anyone can access this endpoint

        [HttpGet("Public")]
        public IActionResult PublicEndpoint()
        {
            return Ok(new
            {
                message = "This is a public endpoint - no authentication required",
                endpoint = "GET /api/Example/Public"
            });
        }


        /// EXAMPLE 2: Requires authentication only
        /// GET /api/Example/Authenticated

        [HttpGet("Authenticated")]
        [Authorize]  // Requires authentication, but any role is OK
        public IActionResult AuthenticatedEndpoint()
        {
            return Ok(new
            {
                message = "This endpoint requires authentication - any logged-in user can access",
                user = User.Identity?.Name,
                endpoint = "GET /api/Example/Authenticated"
            });
        }


        /// EXAMPLE 3: Role-Based Authorization - Admin only
        /// GET /api/Example/AdminOnly
        /// Only users with "Admin" role can access

        [HttpGet("AdminOnly")]
        [Authorize(Roles = "Admin")]  // Only Admin role can access
        public IActionResult AdminOnlyEndpoint()
        {
            return Ok(new
            {
                message = "This endpoint requires Admin role",
                user = User.Identity?.Name,
                roles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value),
                endpoint = "GET /api/Example/AdminOnly"
            });
        }


        /// EXAMPLE 4: Role-Based Authorization - User only
        /// GET /api/Example/UserOnly
        /// Only users with "User" role can access

        [HttpGet("UserOnly")]
        [Authorize(Roles = "User")]  // Only User role can access
        public IActionResult UserOnlyEndpoint()
        {
            return Ok(new
            {
                message = "This endpoint requires User role",
                user = User.Identity?.Name,
                roles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value),
                endpoint = "GET /api/Example/UserOnly"
            });
        }

        /// <summary>
        /// EXAMPLE 5: Policy-Based Authorization - AdminOnly policy
        /// GET /api/Example/PolicyAdminOnly
        /// Uses the "AdminOnly" policy defined in Program.cs
        /// </summary>
        [HttpGet("PolicyAdminOnly")]
        [Authorize(Policy = "AdminOnly")]  // Uses policy from Program.cs
        public IActionResult PolicyAdminOnlyEndpoint()
        {
            return Ok(new
            {
                message = "This endpoint uses AdminOnly policy",
                user = User.Identity?.Name,
                roles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value),
                endpoint = "GET /api/Example/PolicyAdminOnly"
            });
        }

        /// <summary>
        /// EXAMPLE 6: Policy-Based Authorization - AdminOrUser policy
        /// GET /api/Example/PolicyAdminOrUser
        /// Uses the "AdminOrUser" policy - allows both Admin and User roles
        /// </summary>
        [HttpGet("PolicyAdminOrUser")]
        [Authorize(Policy = "AdminOrUser")]  // Uses policy from Program.cs
        public IActionResult PolicyAdminOrUserEndpoint()
        {
            return Ok(new
            {
                message = "This endpoint uses AdminOrUser policy - Admin or User can access",
                user = User.Identity?.Name,
                roles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value),
                endpoint = "GET /api/Example/PolicyAdminOrUser"
            });
        }

        /// <summary>
        /// EXAMPLE 7: Controller-level authorization
        /// GET /api/Example/Protected
        /// This entire controller could have [Authorize] at the top
        /// </summary>
        [HttpGet("Protected")]
        [Authorize]  // Requires authentication
        public IActionResult ProtectedEndpoint()
        {
            return Ok(new
            {
                message = "This endpoint is protected - requires authentication",
                user = User.Identity?.Name,
                endpoint = "GET /api/Example/Protected"
            });
        }
    }
}


