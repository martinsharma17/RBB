using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycDocument
    {
        public const int MaxFileSize = 4 * 1024 * 1024; // 4 MB
        [Key] public int Id { get; set; }

        [Required] public int KycDetailId { get; set; }

        [ForeignKey("KycDetailId")] public virtual KycDetail KycDetail { get; set; } = null!;

        // e.g., "Photo", "CitizenshipFront", "CitizenshipBack", "Passport"
        [Required] [MaxLength(50)] public string DocumentType { get; set; } = string.Empty;

        // Actual image data stored in DB
        public byte[]? Data { get; set; }

        // Actual path on disk or URL (Optional if stored in DB)
        [MaxLength(500)] public string? FilePath { get; set; }

        // Original file name (e.g., "my_photo.jpg")
        [MaxLength(200)] public string OriginalFileName { get; set; } = string.Empty;

        // e.g., ".jpg", ".png", ".pdf"
        [MaxLength(10)] public string FileExtension { get; set; } = string.Empty;

        // e.g., "image/jpeg", "application/pdf"
        [MaxLength(100)] public string ContentType { get; set; } = string.Empty;

        public long FileSize { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // Optional verification status for individual docs
        public bool IsVerified { get; set; } = false;


        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Data != null && Data.Length > MaxFileSize)
            {
                yield return new ValidationResult(
                    $"Document size must not exceed {MaxFileSize} bytes (4 MB).",
                    new[] { nameof(Data) }
                );
            }

            if (FileSize > MaxFileSize)
            {
                yield return new ValidationResult(
                    $"FileSize must not exceed {MaxFileSize} bytes (4 MB).",
                    new[] { nameof(FileSize) }
                );
            }
        }
    }
}
