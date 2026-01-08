using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class ApplicationUser : IdentityUser
    {
        public string Name { get; set; } = string.Empty;
        public string? ManagerId { get; set; } // Added for Admin-User relationship
        public bool IsActive { get; set; } = true;

        public int? BranchId { get; set; }
        [ForeignKey("BranchId")] public virtual Branch? Branch { get; set; }

        /// <summary>
        /// The branch this workflow belongs to.
        /// </summary>
        // The BranchId and Branch properties are already defined above.
        // This comment and the duplicate properties seem to be a copy-paste error in the instruction's snippet.
        // Keeping the first definition of BranchId and Branch as it's already present and correct.
        // Removing the duplicate definition to maintain syntactical correctness.
    }
}
