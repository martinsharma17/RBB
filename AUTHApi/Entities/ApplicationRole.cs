using Microsoft.AspNetCore.Identity;

namespace AUTHApi.Entities
{
    public class ApplicationRole : IdentityRole
    {
        /// <summary>
        /// Numeric representation of the role's rank/order in the system.
        /// Null for system-level roles like SuperAdmin.
        /// </summary>
        public int? OrderLevel { get; set; }

        public ApplicationRole()
        {
        }

        public ApplicationRole(string roleName) : base(roleName)
        {
        }
    }
}
