using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class MenuItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string ViewId { get; set; } = string.Empty; // Maps to frontend 'id' (e.g. 'dashboard')

        public string? Icon { get; set; } // String name of the icon (e.g. 'DashboardIcon')

        public string? Permission { get; set; } // Permission key (e.g. 'view_users')

        public int? ParentId { get; set; }
        
        [ForeignKey("ParentId")]
        public MenuItem? Parent { get; set; }

        public ICollection<MenuItem> Children { get; set; } = new List<MenuItem>();

        public int Order { get; set; }

        public bool IsVisible { get; set; } = true;
    }
}
