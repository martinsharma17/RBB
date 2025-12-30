using AUTHApi.Core.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AUTHApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Only authenticated users (or maybe just Admins?)
    public class PermissionsController : BaseApiController
    {
        // GET: api/permissions
        // Returns the list of all available permissions in the system
        [HttpGet]
        public IActionResult GetAllPermissions()
        {
            var permissions = Permissions.GetAllPermissions();
            return Success(permissions);
        }
    }
}
