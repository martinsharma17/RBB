using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycLocationMap
    {
        [Key] public int Id { get; set; }

        public int? SessionId { get; set; }
        [ForeignKey("SessionId")] public virtual KycFormSession? Session { get; set; }

        public int? KycPersonalInfoId { get; set; }
        [ForeignKey("KycPersonalInfoId")] public virtual KycPersonalInfo? PersonalInfo { get; set; }

        [MaxLength(500)] public string? Landmark { get; set; }

        [MaxLength(100)] public string? DistanceFromMainRoad { get; set; }

        public string? CanvasDataJson { get; set; }

        [MaxLength(50)] public string? Latitude { get; set; }
        [MaxLength(50)] public string? Longitude { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public DateTime? ModifiedDate { get; set; }
        public bool IsDraft { get; set; } = true;
    }
}
