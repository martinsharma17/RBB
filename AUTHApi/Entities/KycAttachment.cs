using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycAttachment
    {
        [Key] public int Id { get; set; }

        public int? SessionId { get; set; }
        [ForeignKey("SessionId")] public virtual KycFormSession? Session { get; set; }

        public int? KycPersonalInfoId { get; set; }
        [ForeignKey("KycPersonalInfoId")] public virtual KycPersonalInfo? PersonalInfo { get; set; }

        /// <summary>
        /// 1=Photo, 2=Citizenship Front, 3=Citizenship Back, 4=Left Thumb Print, 5=Right Thumb Print, 
        /// 6=Passport, 7=Birth Certificate, 8=Guardian Documents, 9=Signature, 10=Others
        /// </summary>
        public byte DocumentType { get; set; }

        [Required] [MaxLength(200)] public string DocumentName { get; set; } = string.Empty;

        [MaxLength(500)] public string? DocumentDescription { get; set; }

        [Required] [MaxLength(200)] public string FileName { get; set; } = string.Empty;

        [Required] [MaxLength(500)] public string FilePath { get; set; } = string.Empty;

        public long? FileSize { get; set; }
        [MaxLength(100)] public string? MimeType { get; set; }

        public int? ImageWidth { get; set; }
        public int? ImageHeight { get; set; }

        [MaxLength(500)] public string? ThumbnailPath { get; set; }

        public bool IsVerified { get; set; } = false;
        [MaxLength(100)] public string? VerifiedBy { get; set; }
        public DateTime? VerifiedDate { get; set; }
        [MaxLength(500)] public string? VerificationNotes { get; set; }

        [MaxLength(100)] public string? UploadedBy { get; set; }
        public DateTime UploadedDate { get; set; } = DateTime.Now;
        public DateTime? ModifiedDate { get; set; }
        public bool IsDraft { get; set; } = true;
    }
}
