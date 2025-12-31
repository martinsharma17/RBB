using System.ComponentModel.DataAnnotations;

namespace AUTHApi.Entities
{
    /// <summary>
    /// Represents a system-wide permission or policy (e.g., "View Users", "Sidebar: Projects").
    /// This replaces the hardcoded string checks with a database-driven approach.
    /// </summary>
    public class SystemPolicy
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// The unique string key used in code (e.g., "Permissions.Users.View").
        /// This must match the constants in Permissions.cs.
        /// </summary>
        [Required]
        [MaxLength(255)]
        public string PolicyKey { get; set; } = string.Empty;

        /// <summary>
        /// A human-readable name for the permission (e.g., "View Users List").
        /// </summary>
        [MaxLength(100)]
        public string DisplayName { get; set; } = string.Empty;

        /// <summary>
        /// Grouping category (e.g., "Users", "Tasks", "Projects").
        /// Used for organizing the Policy Editor UI.
        /// </summary>
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;

        /// <summary>
        /// Optional description of what this policy allows.
        /// </summary>
        [MaxLength(500)]
        public string? Description { get; set; }
    }
}
    