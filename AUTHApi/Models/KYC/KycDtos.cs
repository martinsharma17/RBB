using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AUTHApi.Models.KYC
{
    public class KycFormDto
    {
        public int Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public int CurrentStep { get; set; }
        public KycPersonalInfoDto? PersonalInfo { get; set; }
        public KycAddressDto? Address { get; set; }
        public KycFamilyDto? Family { get; set; }
        public KycBankDto? Bank { get; set; }
        public KycOccupationDto? Occupation { get; set; }
        public KycGuardianDto? Guardian { get; set; }
        public KycLegalDto? Legal { get; set; }
        public KycInvestmentDto? Investment { get; set; }
        public List<KycAttachmentDto> Attachments { get; set; } = new();
    }

    public class KycPersonalInfoDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;
        public DateTime? DobAd { get; set; }
        public string? DobBs { get; set; }
        public string? Gender { get; set; }
        public string? Nationality { get; set; }
        public string? CitizenshipNo { get; set; }
        public DateTime? CitizenshipIssueDate { get; set; }
        public string? CitizenshipIssueDistrict { get; set; }
        public string? PanNo { get; set; }
    }

    public class KycAddressDto
    {
        public string? CurrentMunicipality { get; set; }
        public string? CurrentDistrict { get; set; }
        public string? CurrentProvince { get; set; }
        public string? CurrentCountry { get; set; }
        public string? PermanentMunicipality { get; set; }
        public string? PermanentDistrict { get; set; }
        public string? PermanentProvince { get; set; }
        public string? PermanentCountry { get; set; }
        public string? WardNo { get; set; }
        public string? ContactNumber { get; set; }
        public string? Email { get; set; }
    }

    public class KycFamilyDto
    {
        public string? FatherName { get; set; }
        public string? MotherName { get; set; }
        public string? GrandfatherName { get; set; }
        public string? SpouseName { get; set; }
        public string? ChildrenNames { get; set; }
        public string? InlawsNames { get; set; }
    }

    public class KycBankDto
    {
        public string? AccountType { get; set; }
        public string? AccountNumber { get; set; }
        public string? BankName { get; set; }
        public string? BankAddress { get; set; }
    }

    public class KycOccupationDto
    {
        public string? Occupation { get; set; }
        public string? OrgName { get; set; }
        public string? OrgAddress { get; set; }
        public string? Designation { get; set; }
        public string? EmployeeIdNo { get; set; }
        public string? AnnualIncomeBracket { get; set; }
    }

    public class KycGuardianDto
    {
        public string? Name { get; set; }
        public string? Relationship { get; set; }
        public string? Address { get; set; }
        public string? ContactNo { get; set; }
        public string? Email { get; set; }
        public string? PanNo { get; set; }
        public DateTime? Dob { get; set; }
        public string? IssueDistrict { get; set; }
    }

    public class KycLegalDto
    {
        public string? DeclarationText { get; set; }
        public DateTime? ConsentDate { get; set; }
        public bool IsAgreed { get; set; }
    }

    public class KycInvestmentDto
    {
        public string? Details { get; set; }
        public bool IsInvolved { get; set; }
    }

    public class KycAttachmentDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string? FileType { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
    }
}
