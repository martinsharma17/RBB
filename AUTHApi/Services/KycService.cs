using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using AUTHApi.Data;
using AUTHApi.Entities;
using AUTHApi.Models.KYC;
using AUTHApi.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;

namespace AUTHApi.Services
{
    /// <summary>
    /// Concrete implementation of <see cref="IKycService"/>.
    /// Handles all data‑access operations for KYC, keeping controllers thin and testable.
    /// </summary>
    public class KycService : IKycService
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public KycService(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        public async Task<KycDetail> GetOrCreateDetailAsync(int sessionId)
        {
            var detail = await _context.KycDetails.FirstOrDefaultAsync(k => k.SessionId == sessionId);
            if (detail == null)
            {
                detail = new KycDetail { SessionId = sessionId };
                _context.KycDetails.Add(detail);
                await _context.SaveChangesAsync();
            }

            return detail;
        }

        public async Task<int> UpdateDetailAsync<TDto>(int sessionId, int stepNumber, TDto dto)
        {
            var detail = await GetOrCreateDetailAsync(sessionId);
            // Map DTO to entity based on its concrete type
            switch (dto)
            {
                case PersonalInfoDto p:
                    detail.FirstName = p.FullName?.Split(' ')[0] ?? string.Empty;
                    // Simple split for demo – real implementation may need more robust parsing
                    if (p.FullName != null)
                    {
                        var parts = p.FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length > 1) detail.LastName = parts[^1];
                        if (parts.Length > 2) detail.MiddleName = string.Join(' ', parts[1..^1]);
                    }

                    detail.DateOfBirth = p.DateOfBirthAd ?? DateTime.MinValue;
                    detail.Gender = p.Gender == 1 ? "Male" : p.Gender == 2 ? "Female" : "Other";
                    detail.Nationality = p.IsNepali ? "Nepali" : p.OtherNationality ?? "";
                    detail.CitizenshipNumber = p.CitizenshipNo;
                    detail.CitizenshipIssuedDistrict = p.CitizenshipIssueDistrict;
                    detail.CitizenshipIssuedDate = p.CitizenshipIssueDate;
                    break;

                case AddressDto a:
                    // Determine if this is current or permanent based on a flag (we reuse stepNumber)
                    if (stepNumber == 2) // current address
                    {
                        detail.CurrentState = a.Province;
                        detail.CurrentDistrict = a.District;
                        detail.CurrentMunicipality = a.MunicipalityName;
                        detail.CurrentWardNo = a.WardNo?.ToString();
                        detail.CurrentStreet = a.Tole;
                        detail.MobileNumber = a.MobileNo ?? string.Empty;
                        detail.Email = a.EmailId ?? string.Empty;
                    }
                    else if (stepNumber == 3) // permanent address
                    {
                        detail.PermanentState = a.Province;
                        detail.PermanentDistrict = a.District;
                        detail.PermanentMunicipality = a.MunicipalityName;
                        detail.PermanentWardNo = a.WardNo?.ToString();
                        detail.PermanentStreet = a.Tole;
                    }

                    break;

                case FamilyDto f:
                    detail.FatherName = f.FatherName;
                    detail.MotherName = f.MotherName;
                    detail.GrandFatherName = f.GrandFatherName;
                    detail.SpouseName = f.SpouseName;
                    break;

                case BankDto b:
                    detail.BankName = b.BankName;
                    detail.BankAccountNumber = b.BankAccountNo;
                    detail.BankBranch = b.BankAddress;
                    break;

                case OccupationDto o:
                    detail.Occupation = o.OccupationType?.ToString();
                    detail.OrganizationName = o.OrganizationName;
                    // detail.AnnualIncome = o.AnnualIncomeRange; // Property does not exist on OccupationDto
                    break;

                case FinancialDetailsDto f:
                    detail.AnnualIncome = f.AnnualIncomeRange; // or EstimatedAnnualIncome
                    break;

                case TransactionInfoDto t:
                    detail.SourceOfFunds = t.SourceOfNetWorth;
                    detail.MajorSourceOfIncome = t.MajorSourceOfIncome;
                    detail.HasOtherBrokerAccount = t.HasOtherBrokerAccount;
                    detail.OtherBrokerNames = t.OtherBrokerNames;
                    detail.IsCibBlacklisted = t.IsCibBlacklisted;
                    detail.CibBlacklistDetails = t.CibBlacklistDetails;
                    break;

                case GuardianDto g:
                    detail.GuardianName = g.FullName;
                    detail.GuardianRelationship = g.Relationship;
                    detail.GuardianAddress = g.Address;
                    detail.GuardianContactNo = g.ContactNo;
                    break;

                case AmlComplianceDto aml:
                    detail.IsPep = aml.IsPoliticallyExposedPerson;
                    detail.PepRelation = aml.PepRelationName ?? aml.PepRelationship;
                    detail.HasBeneficialOwner = aml.HasBeneficialOwner;
                    detail.HasCriminalRecord = aml.HasCriminalRecord;
                    detail.CriminalRecordDetails = aml.CriminalRecordDetails;
                    break;

                case DeclarationsDto d:
                    detail.TermsAgreed = d.AgreeToTerms;
                    break;

                case AgreementDto ag:
                    detail.AgreementDate = ag.AgreementDate;
                    break;

                default:
                    throw new ArgumentException($"Unsupported DTO type: {typeof(TDto).Name}");
            }

            detail.UpdatedAt = DateTime.Now;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                // Let the controller translate to 409 Conflict
                throw;
            }

            return detail.Id;
        }

        public async Task<KycDocument> UploadDocumentAsync(int sessionId, string documentType, string fileName,
            byte[] content, string contentType)
        {
            var detail = await GetOrCreateDetailAsync(sessionId);
            var uploadsRoot = Path.Combine(_env.WebRootPath, "uploads", "kyc", sessionId.ToString());
            if (!Directory.Exists(uploadsRoot)) Directory.CreateDirectory(uploadsRoot);

            var safeFileName = Path.GetFileNameWithoutExtension(fileName);
            var ext = Path.GetExtension(fileName);
            var uniqueName = $"{documentType}_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadsRoot, uniqueName);
            await File.WriteAllBytesAsync(filePath, content);

            var doc = new KycDocument
            {
                KycDetailId = detail.Id,
                DocumentType = documentType,
                OriginalFileName = fileName,
                FilePath = filePath,
                FileExtension = ext,
                ContentType = contentType,
                FileSize = content.Length,
                UploadedAt = DateTime.UtcNow
            };
            _context.KycDocuments.Add(doc);
            await _context.SaveChangesAsync();
            return doc;
        }

        public async Task<KycProgressDto> GetProgressAsync(int sessionId)
        {
            // Reuse existing KycProgressDto from KycSessionDtos
            var session = await _context.KycFormSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
            if (session == null) return null;

            var steps = await _context.KycFormSteps
                .OrderBy(s => s.StepNumber)
                .Select(s => new StepStatusDto
                {
                    StepNumber = s.StepNumber,
                    StepName = s.StepName,
                    StepNameNepali = s.StepNameNepali,
                    IsRequired = s.IsRequired,
                    IsCompleted = _context.KycStepCompletions.Any(sc =>
                        sc.SessionId == sessionId && sc.StepNumber == s.StepNumber && sc.IsCompleted),
                    IsSaved = _context.KycStepCompletions.Any(sc =>
                        sc.SessionId == sessionId && sc.StepNumber == s.StepNumber && sc.IsSaved),
                    SavedDate = _context.KycStepCompletions
                        .Where(sc => sc.SessionId == sessionId && sc.StepNumber == s.StepNumber && sc.IsSaved)
                        .Select(sc => sc.SavedDate)
                        .FirstOrDefault(),
                    RecordId = _context.KycStepCompletions
                        .Where(sc => sc.SessionId == sessionId && sc.StepNumber == s.StepNumber)
                        .Select(sc => sc.RecordId)
                        .FirstOrDefault()
                })
                .ToListAsync();

            var progress = new KycProgressDto
            {
                Session = new KycSessionResponseDto
                {
                    SessionId = session.Id,
                    SessionToken = session.SessionToken,
                    Email = session.Email,
                    EmailVerified = session.EmailVerified,
                    CurrentStep = session.CurrentStep,
                    LastSavedStep = session.LastSavedStep,
                    FormStatus = session.FormStatus
                },
                Steps = steps
            };
            return progress;
        }
    }
}
