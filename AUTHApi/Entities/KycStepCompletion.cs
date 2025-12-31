using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycStepCompletion
    {
        [Key] public int Id { get; set; }

        [Required] public int SessionId { get; set; }

        [ForeignKey("SessionId")] public virtual KycFormSession? Session { get; set; }

        [Required] public int StepNumber { get; set; }

        [ForeignKey("StepNumber")] public virtual KycFormSteps? Step { get; set; }

        public bool IsCompleted { get; set; } = false;
        public DateTime? CompletedDate { get; set; }

        public bool IsSaved { get; set; } = false;
        public DateTime? SavedDate { get; set; }

        public bool IsValidated { get; set; } = false;
        public string? ValidationErrors { get; set; } // JSON format

        public int? RecordId { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? ModifiedDate { get; set; }
    }
}
