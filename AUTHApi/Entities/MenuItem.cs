using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class MenuItem
    {
        [Key] public int Id { get; set; }

        [Required] public string Title { get; set; } = string.Empty;

        [Required] public string ViewId { get; set; } = string.Empty; // Maps to frontend 'id' (e.g. 'dashboard')

        /// <summary>
        /// Optional URL path for this menu item (e.g. '/kyc', '/users').
        /// If provided, can be used for navigation. Falls back to ViewId if null.
        /// </summary>
        public string? Url { get; set; }

        public string? Icon { get; set; } // String name of the icon (e.g. 'DashboardIcon')

        public string? Permission { get; set; } // Legacy string key, kept for transitional safety or as a fallback 

        public int? RequiredPolicyId { get; set; }

        [ForeignKey("RequiredPolicyId")] public SystemPolicy? RequiredPolicy { get; set; }

        public int? ParentId { get; set; }

        [ForeignKey("ParentId")] public MenuItem? Parent { get; set; }

        public ICollection<MenuItem> Children { get; set; } = new List<MenuItem>();

        public int Order { get; set; }

        public bool IsVisible { get; set; } = true;
    }
}
