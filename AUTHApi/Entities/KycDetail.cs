using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycDetail
    {
        [Key] public int Id { get; set; }

        public string? UserId { get; set; }
        [ForeignKey("UserId")] public virtual ApplicationUser? User { get; set; }

        public int? SessionId { get; set; }

        // We will configure the FK in DbContext or via attribute if Session class is available. 
        // [ForeignKey("SessionId")] public virtual KycFormSession? Session { get; set; } 
        // Circular reference care needed. For now just ID.
        public int? BranchId { get; set; }

        // --- 1. Personal Information ---
        [MaxLength(50)] public string? FirstName { get; set; }
        [MaxLength(50)] public string? MiddleName { get; set; }
        [MaxLength(50)] public string? LastName { get; set; }
        public DateTime? DateOfBirth { get; set; }

        [MaxLength(10)] public string? Gender { get; set; } // Male, Female, Other
        [MaxLength(20)] public string? MaritalStatus { get; set; }
        [MaxLength(50)] public string? Nationality { get; set; }
        [Phone] [MaxLength(20)] public string? MobileNumber { get; set; }
        [EmailAddress] [MaxLength(100)] public string? Email { get; set; }

        // --- 2. Address Details ---

        // Permanent Address
        [MaxLength(100)] public string? PermanentState { get; set; }
        [MaxLength(100)] public string? PermanentDistrict { get; set; }
        [MaxLength(100)] public string? PermanentMunicipality { get; set; }
        [MaxLength(10)] public string? PermanentWardNo { get; set; }
        [MaxLength(200)] public string? PermanentStreet { get; set; }

        // Current Address
        [MaxLength(100)] public string? CurrentState { get; set; }
        [MaxLength(100)] public string? CurrentDistrict { get; set; }
        [MaxLength(100)] public string? CurrentMunicipality { get; set; }
        [MaxLength(10)] public string? CurrentWardNo { get; set; }
        [MaxLength(200)] public string? CurrentStreet { get; set; }

        // --- 3. Family Details ---
        [MaxLength(100)] public string? FatherName { get; set; }
        [MaxLength(100)] public string? MotherName { get; set; }
        [MaxLength(100)] public string? GrandFatherName { get; set; }
        [MaxLength(100)] public string? SpouseName { get; set; }
        [MaxLength(100)] public string? SonName { get; set; }
        [MaxLength(100)] public string? DaughterName { get; set; }

        // --- 4. Identification & Financial ---
        [MaxLength(50)] public string? CitizenshipNumber { get; set; }
        [MaxLength(50)] public string? CitizenshipIssuedDistrict { get; set; }
        public DateTime? CitizenshipIssuedDate { get; set; }

        [MaxLength(50)] public string? PanNumber { get; set; }
        [MaxLength(100)] public string? Occupation { get; set; }
        [MaxLength(100)] public string? OtherOccupation { get; set; }
        [MaxLength(50)] public string? ServiceSector { get; set; }
        [MaxLength(50)] public string? BusinessType { get; set; }
        [MaxLength(100)] public string? OrganizationName { get; set; }
        [MaxLength(200)] public string? OrganizationAddress { get; set; }
        [MaxLength(100)] public string? Designation { get; set; }
        [MaxLength(50)] public string? EmployeeIdNo { get; set; }
        [MaxLength(50)] public string? AnnualIncome { get; set; }

        // --- 5. Bank Info (If needed) ---
        [MaxLength(100)] public string? BankName { get; set; }
        [MaxLength(50)] public string? BankAccountNumber { get; set; }
        [MaxLength(100)] public string? BankBranch { get; set; }
        [MaxLength(50)] public string? BankAccountType { get; set; }

        // --- Meta ---
        public bool IsVerified { get; set; } = false;
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        public string? RejectionReason { get; set; }

        // --- 6. Financial & Transaction Details ---
        [MaxLength(100)] public string? SourceOfFunds { get; set; }
        [MaxLength(100)] public string? MajorSourceOfIncome { get; set; }
        public bool HasOtherBrokerAccount { get; set; }
        [MaxLength(200)] public string? OtherBrokerNames { get; set; }
        public bool IsCibBlacklisted { get; set; }
        [MaxLength(500)] public string? CibBlacklistDetails { get; set; }

        // --- 7. Guardian Details ---
        [MaxLength(100)] public string? GuardianName { get; set; }
        [MaxLength(50)] public string? GuardianRelationship { get; set; }
        [MaxLength(200)] public string? GuardianAddress { get; set; }
        [MaxLength(20)] public string? GuardianContactNo { get; set; }
        [MaxLength(100)] public string? GuardianEmail { get; set; }
        [MaxLength(50)] public string? GuardianPanNumber { get; set; }

        // --- 8. AML & Compliance ---
        public bool IsPep { get; set; } // Politically Exposed Person
        [MaxLength(100)] public string? PepRelation { get; set; }
        public bool HasBeneficialOwner { get; set; }
        public bool HasCriminalRecord { get; set; }
        [MaxLength(500)] public string? CriminalRecordDetails { get; set; }

        // --- 11. Location Map ---
        [MaxLength(200)] public string? LocationLandmark { get; set; }
        [MaxLength(50)] public string? LocationDistance { get; set; }
        [MaxLength(50)] public string? LocationLatitude { get; set; }
        [MaxLength(50)] public string? LocationLongitude { get; set; }
        public string? LocationSketchJson { get; set; }

        // --- 12. Declarations ---
        public bool AgreeToTerms { get; set; }
        public bool NoOtherFinancialLiability { get; set; }
        public bool AllInformationTrue { get; set; }

        // --- 13. Agreements ---
        public DateTime? AgreementDate { get; set; }
        [MaxLength(50)] public string? TradingLimit { get; set; }
        public bool MarginTradingFacility { get; set; }

        // [Timestamp] public byte[] RowVersion { get; set; } = Array.Empty<byte>();

        public DateTime? UpdatedAt { get; set; }

        // --- Documents Relationship ---
        public virtual ICollection<KycDocument> Documents { get; set; } = new List<KycDocument>();
    }
}
