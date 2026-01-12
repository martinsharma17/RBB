// AUTHApi/Entities/Occupation.cs
using System.ComponentModel.DataAnnotations;

namespace AUTHApi.Entities
{
    public class Occupation
    {
        [Key]
        public int Id { get; set; }
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
    }
}