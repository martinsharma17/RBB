using System;
using System.Collections.Generic;

namespace AUTHApi.DTOs
{
    public class KycInitializeDto
    {
        public string Email { get; set; } = string.Empty;
        public string? MobileNo { get; set; }
        public string? IPAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? DeviceFingerprint { get; set; }
    }

    public class VerifyOtpDto
    {
        public int SessionId { get; set; }
        public string OTPCode { get; set; } = string.Empty;
        public byte OTPType { get; set; } // 1=Email, 2=Mobile
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

    public class SaveStepDto<T>
    {
        public int SessionId { get; set; }
        public int StepNumber { get; set; }
        public T Data { get; set; } = default!;
    }
}
