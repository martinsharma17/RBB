using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace AUTHApi.Entities
{
    public class Province
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)] // Using ID from JSON file
        public int Id { get; set; }

        [Required] [MaxLength(100)] public string Name { get; set; } = string.Empty;

        // Navigation
        [JsonIgnore] public virtual ICollection<District> Districts { get; set; } = new List<District>();
    }

    public class District
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Id { get; set; }

        [Required] [MaxLength(100)] public string Name { get; set; } = string.Empty;

        public int ProvinceId { get; set; }

        [ForeignKey("ProvinceId")]
        [JsonIgnore]
        public virtual Province? Province { get; set; }

        [JsonIgnore] public virtual ICollection<Municipality> Municipalities { get; set; } = new List<Municipality>();
    }

    public class Municipality
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Id { get; set; }

        [Required] [MaxLength(150)] public string Name { get; set; } = string.Empty;

        public int DistrictId { get; set; }

        [ForeignKey("DistrictId")]
        [JsonIgnore]
        public virtual District? District { get; set; }
    }
}
