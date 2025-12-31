using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace AUTHApi.Entities
{
    /// <summary>
    /// Represents the link between a Role and a SystemPolicy.
    /// If a record exists here with IsGranted=true, the role has that permission.
    /// This table replaces the IdentityRoleClaim usage for our custom permissions.
    /// </summary>
    public class RolePolicy
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string RoleId { get; set; } = string.Empty;

        [ForeignKey("RoleId")]
        public IdentityRole? Role { get; set; }

        [Required]
        public int PolicyId { get; set; }

        [ForeignKey("PolicyId")]
        public SystemPolicy? Policy { get; set; }

        /// <summary>
        /// Explicitly grants or denies the permission.
        /// Currently true = granted. If record is missing, it is denied by default.
        /// </summary>
        public bool IsGranted { get; set; } = true;
    }
}
