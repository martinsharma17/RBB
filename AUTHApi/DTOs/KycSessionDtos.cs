using System.ComponentModel.DataAnnotations;

namespace AUTHApi.DTOs
{
    public class KycInitializeDto
    {
        public string Email { get; set; } = string.Empty;
        public string? MobileNo { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? DeviceFingerprint { get; set; }
        public bool ForceNew { get; set; } = false;
    }

    public class InitiateKycDto
    {
        [Required] [EmailAddress] public string Email { get; set; } = string.Empty;
    }

    public class VerifyOtpDto
    {
        public Guid SessionToken { get; set; }
        public string? Email { get; set; }
        public string? OtpCode { get; set; }
        public int OtpType { get; set; } // 1=Email, 2=Mobile
    }

    public class VerifyOtpResponseDto
    {
        public bool Success { get; set; }
        public Guid? SessionToken { get; set; }
        public List<KycSessionBriefDto> AvailableSessions { get; set; } = new();
    }

    public class KycSessionBriefDto
    {
        public int SessionId { get; set; }
        public Guid SessionToken { get; set; }
        public DateTime CreatedDate { get; set; }
        public int CurrentStep { get; set; }
        public int LastSavedStep { get; set; }
        public byte FormStatus { get; set; }
    }

    public class KycSessionResponseDto
    {
        public int SessionId { get; set; }
        public Guid SessionToken { get; set; }
        public string Email { get; set; } = string.Empty;
        public bool EmailVerified { get; set; }
        public int CurrentStep { get; set; }
        public int LastSavedStep { get; set; }
        public byte FormStatus { get; set; }
    }

    public class KycProgressDto
    {
        public KycSessionResponseDto Session { get; set; } = new();
        public List<StepStatusDto> Steps { get; set; } = new();
    }

    public class StepStatusDto
    {
        public int StepNumber { get; set; }
        public string StepName { get; set; } = string.Empty;
        public string? StepNameNepali { get; set; }
        public bool IsCompleted { get; set; }
        public bool IsSaved { get; set; }
        public DateTime? SavedDate { get; set; }
        public int? RecordId { get; set; }
        public bool IsRequired { get; set; }
    }

    public class SaveStepDto<T, TKey>
    {
        public TKey SessionToken { get; set; } = default!;
        public int StepNumber { get; set; }
        public T Data { get; set; } = default!;
    }

    public class StepCompletionDto
    {
        public Guid SessionToken { get; set; }
        public int StepNumber { get; set; }
        public int? RecordId { get; set; }
    }
}
