using Microsoft.AspNetCore.Identity;

namespace AUTHApi.Entities
{
    public class ApplicationUser:IdentityUser
    {
        public string Name { get; set; } = string.Empty;
        public string? ManagerId { get; set; } // Added for Admin-User relationship
        public bool IsActive { get; set; } = true;
    }
}
