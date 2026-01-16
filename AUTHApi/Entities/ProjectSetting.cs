using System;
using System.ComponentModel.DataAnnotations;

namespace AUTHApi.Entities
{
    public class ProjectSetting
    {
        [Key] public int Id { get; set; }

        [Required] [StringLength(100)] public string ApplicationName { get; set; } = "Identity System";

        public string? LogoPath { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
