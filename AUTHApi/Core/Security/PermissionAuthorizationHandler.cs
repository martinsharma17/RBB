using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace AUTHApi.Core.Security
{
    public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            if (context.User == null)
            {
                return;
            }

            // Check if the user has the required permission claim
            // "Permission" is the ClaimType we will use for all permission claims.
            // "Permissions.Tasks.Create" is the ClaimValue.
            var permissions = context.User.Claims
                .Where(x => x.Type == "Permission" &&
                            x.Value == requirement.Permission);

            if (permissions.Any())
            {
                context.Succeed(requirement);
                return;
            }
            
            // SuperAdmin Bypass: SuperAdmin role generally implies access to everything
            if (context.User.IsInRole("SuperAdmin"))
            {
                 context.Succeed(requirement);
                 return;
            }
            
        }
    }
}
