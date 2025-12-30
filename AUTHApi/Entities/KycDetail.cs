using System;
using System.Collections.Generic;
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

        // --- 1. Personal Information ---
        [Required] [MaxLength(50)] public string FirstName { get; set; } = string.Empty;

        [MaxLength(50)] public string? MiddleName { get; set; }

        [Required] [MaxLength(50)] public string LastName { get; set; } = string.Empty;

        public DateTime DateOfBirth { get; set; }

        [MaxLength(10)] public string Gender { get; set; } = string.Empty; // Male, Female, Other

        [MaxLength(20)] public string MaritalStatus { get; set; } = string.Empty;

        [MaxLength(50)] public string Nationality { get; set; } = string.Empty;

        [Phone] [MaxLength(20)] public string MobileNumber { get; set; } = string.Empty;

        [EmailAddress] [MaxLength(100)] public string Email { get; set; } = string.Empty;

        // --- 2. Address Details ---

        // Permanent Address
        [MaxLength(100)] public string PermanentState { get; set; } = string.Empty;
        [MaxLength(100)] public string PermanentDistrict { get; set; } = string.Empty;
        [MaxLength(100)] public string PermanentMunicipality { get; set; } = string.Empty; // or City
        [MaxLength(10)] public string PermanentWardNo { get; set; } = string.Empty;
        [MaxLength(200)] public string PermanentStreet { get; set; } = string.Empty;

        // Current Address
        [MaxLength(100)] public string? CurrentState { get; set; }
        [MaxLength(100)] public string? CurrentDistrict { get; set; }
        [MaxLength(100)] public string? CurrentMunicipality { get; set; }
        [MaxLength(10)] public string? CurrentWardNo { get; set; }
        [MaxLength(200)] public string? CurrentStreet { get; set; }

        // --- 3. Family Details ---
        [MaxLength(100)] public string FatherName { get; set; } = string.Empty;
        [MaxLength(100)] public string MotherName { get; set; } = string.Empty;
        [MaxLength(100)] public string GrandFatherName { get; set; } = string.Empty;
        [MaxLength(100)] public string? SpouseName { get; set; }

        // --- 4. Identification & Financial ---
        [MaxLength(50)] public string? CitizenshipNumber { get; set; }
        [MaxLength(50)] public string? CitizenshipIssuedDistrict { get; set; }
        public DateTime? CitizenshipIssuedDate { get; set; }

        [MaxLength(50)] public string? PanNumber { get; set; }
        [MaxLength(100)] public string? Occupation { get; set; }
        [MaxLength(100)] public string? OrganizationName { get; set; }
        [MaxLength(50)] public string? AnnualIncome { get; set; }

        // --- 5. Bank Info (If needed) ---
        [MaxLength(100)] public string? BankName { get; set; }
        [MaxLength(50)] public string? BankAccountNumber { get; set; }
        [MaxLength(100)] public string? BankBranch { get; set; }

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

        // --- 8. AML & Compliance ---
        public bool IsPep { get; set; } // Politically Exposed Person
        [MaxLength(100)] public string? PepRelation { get; set; }
        public bool HasBeneficialOwner { get; set; }
        public bool HasCriminalRecord { get; set; }
        [MaxLength(500)] public string? CriminalRecordDetails { get; set; }

        // --- 9. Agreements ---
        public bool TermsAgreed { get; set; }
        public DateTime? AgreementDate { get; set; }

        [Timestamp] public byte[] RowVersion { get; set; }

        public DateTime? UpdatedAt { get; set; }

        // --- Documents Relationship ---
        public virtual ICollection<KycDocument> Documents { get; set; } = new List<KycDocument>();
    }
}
