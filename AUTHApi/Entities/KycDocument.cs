using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycDocument
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int KycDetailId { get; set; }
        
        [ForeignKey("KycDetailId")]
        public virtual KycDetail KycDetail { get; set; } = null!;

        // e.g., "Photo", "CitizenshipFront", "CitizenshipBack", "Passport"
        [Required]
        [MaxLength(50)]
        public string DocumentType { get; set; } = string.Empty; 

        // Actual path on disk or URL
        [Required]
        [MaxLength(500)]
        public string FilePath { get; set; } = string.Empty;

        // Original file name (e.g., "my_photo.jpg")
        [MaxLength(200)]
        public string OriginalFileName { get; set; } = string.Empty;

        // e.g., ".jpg", ".png", ".pdf"
        [MaxLength(10)]
        public string FileExtension { get; set; } = string.Empty;

        // e.g., "image/jpeg", "application/pdf"
        [MaxLength(100)]
        public string ContentType { get; set; } = string.Empty;

        public long FileSize { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.Now;
        
        // Optional verification status for individual docs
        public bool IsVerified { get; set; } = false;
    }
}
