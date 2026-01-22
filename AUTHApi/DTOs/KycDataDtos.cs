namespace AUTHApi.DTOs
{
    public class PersonalInfoDto
    {
        public string FullName { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? DateOfBirthBs { get; set; }
        public DateTime? DateOfBirthAd { get; set; }
        public byte? Gender { get; set; }
        public bool IsNepali { get; set; }
        public string? OtherNationality { get; set; }
        public string? CitizenshipNo { get; set; }
        public string? CitizenshipIssueDistrict { get; set; }
        public DateTime? CitizenshipIssueDate { get; set; }
        public string? ClientAccountNo { get; set; }
        public string? ReferenceNo { get; set; }
        public int? BranchId { get; set; }
        public string? PanNo { get; set; }
        public string? MaritalStatus { get; set; }
        public string? NidNo { get; set; }
    }

    public class AddressDto
    {
        public string Country { get; set; } = "Nepal";
        public string? Province { get; set; }
        public string? District { get; set; }
        public byte? MunicipalityType { get; set; }
        public string? MunicipalityName { get; set; }
        public int? WardNo { get; set; }
        public string? Tole { get; set; }
        public string? FullAddress { get; set; }
        public string? TelephoneNo { get; set; }
        public string MobileNo { get; set; } = string.Empty;
        public string? EmailId { get; set; }
    }

    public class FamilyDto
    {
        public string? GrandFatherName { get; set; }
        public string? FatherName { get; set; }
        public string? MotherName { get; set; }
        public string? SpouseName { get; set; }
        public string? SonName { get; set; }
        public string? DaughterName { get; set; }
        public string? DaughterInLawName { get; set; }
        public string? FatherInLawName { get; set; }
        public string? MotherInLawName { get; set; }
        public string? ChildrenNames { get; set; }
    }

    public class BankDto
    {
        public byte? AccountType { get; set; }
        public string BankAccountNo { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public string? BankAddress { get; set; }
    }

    public class OccupationDto
    {
        public string? OccupationType { get; set; }
        public string? OtherOccupation { get; set; }
        public string? ServiceSector { get; set; }
        public string? BusinessType { get; set; }
        public string? OrganizationName { get; set; }
        public string? OrganizationAddress { get; set; }
        public string? Designation { get; set; }
        public string? EmployeeIdNo { get; set; }
        public string? AnnualIncomeRange { get; set; }
    }

    public class FinancialDetailsDto
    {
        public string? AnnualIncomeRange { get; set; }
        public string? EstimatedAnnualIncome { get; set; }
    }

    public class TransactionInfoDto
    {
        public string? SourceOfNetWorth { get; set; }
        public string? MajorSourceOfIncome { get; set; }
        public bool HasOtherBrokerAccount { get; set; }
        public string? OtherBrokerNames { get; set; }
        public bool IsCibBlacklisted { get; set; }
        public string? CibBlacklistDetails { get; set; }
    }

    public class GuardianDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Relationship { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? ContactNo { get; set; }
        public string? EmailId { get; set; }
        public string? PermanentAccountNo { get; set; }
        public string? Occupation { get; set; }
    }

    public class AmlComplianceDto
    {
        public bool IsPoliticallyExposedPerson { get; set; }
        public bool IsRelatedToPep { get; set; }
        public string? PepRelationName { get; set; }
        public string? PepRelationship { get; set; }
        public bool HasBeneficialOwner { get; set; }
        public string? BeneficialOwnerDetails { get; set; }
        public bool HasCriminalRecord { get; set; }
        public string? CriminalRecordDetails { get; set; }
    }

    public class LocationMapDto
    {
        public string? Landmark { get; set; }
        public string? DistanceFromMainRoad { get; set; }
        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
        public string? CanvasDataJson { get; set; }
    }

    public class DeclarationsDto
    {
        public bool AgreeToTerms { get; set; }
        public bool NoOtherFinancialLiability { get; set; }
        public bool AllInformationTrue { get; set; }
    }

    public class AgreementDto
    {
        public DateTime AgreementDate { get; set; } = DateTime.Now;
        public string? TradingLimit { get; set; }
        public bool MarginTradingFacility { get; set; }
    }

    public class KycAttachmentDto
    {
        public int Id { get; set; }
        public byte DocumentType { get; set; }
        public string DocumentName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string? MimeType { get; set; }
    }

    public class KycFullDetailsDto
    {
        public int SessionId { get; set; }
        public string? Email { get; set; }
        public int CurrentStep { get; set; }
        public PersonalInfoDto? PersonalInfo { get; set; }
        public AddressDto? CurrentAddress { get; set; }
        public AddressDto? PermanentAddress { get; set; }
        public FamilyDto? Family { get; set; }
        public BankDto? Bank { get; set; }
        public OccupationDto? Occupation { get; set; }
        public FinancialDetailsDto? FinancialDetails { get; set; }
        public TransactionInfoDto? TransactionInfo { get; set; }
        public GuardianDto? Guardian { get; set; }
        public AmlComplianceDto? AmlCompliance { get; set; }
        public List<KycAttachmentDto> Attachments { get; set; } = new();
        public LocationMapDto? LocationMap { get; set; }
        public DeclarationsDto? Declarations { get; set; }
        public AgreementDto? Agreement { get; set; }
    }
}

