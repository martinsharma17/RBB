using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace AUTHApi.Core.Security
{
    public class PermissionPolicyProvider : IAuthorizationPolicyProvider
    {
        public DefaultAuthorizationPolicyProvider FallbackPolicyProvider { get; }

        public PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
        {
            FallbackPolicyProvider = new DefaultAuthorizationPolicyProvider(options);
        }

        public Task<AuthorizationPolicy> GetDefaultPolicyAsync() => FallbackPolicyProvider.GetDefaultPolicyAsync();

        public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() => FallbackPolicyProvider.GetFallbackPolicyAsync();

        public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
        {
            // Dynamically create a policy if the policy name starts with "Permissions."
            // This allows us to use [Authorize(Policy = Permissions.Tasks.Create)] without registering every single string in Program.cs
            
            if (policyName.StartsWith("Permissions", StringComparison.OrdinalIgnoreCase))
            {
                var policy = new AuthorizationPolicyBuilder();
                policy.AddRequirements(new PermissionRequirement(policyName));
                return Task.FromResult<AuthorizationPolicy?>(policy.Build());
            }

            // If it's not a permission policy (e.g. "AdminOnly"), use the default provider.
            return FallbackPolicyProvider.GetPolicyAsync(policyName);
        }
    }
}
