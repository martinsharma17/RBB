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
                detail = new KycDetail
                {
                    SessionId = sessionId,
                    UpdatedAt = DateTime.UtcNow,
                    FirstName = "Draft",
                    LastName = "Draft"
                };
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
                    if (!string.IsNullOrEmpty(p.FullName))
                    {
                        var parts = p.FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                        detail.FirstName = parts[0];
                        if (parts.Length > 1) detail.LastName = parts[^1];
                        if (parts.Length > 2) detail.MiddleName = string.Join(' ', parts[1..^1]);
                    }

                    if (p.DateOfBirthAd.HasValue)
                    {
                        detail.DateOfBirth = DateTime.SpecifyKind(p.DateOfBirthAd.Value, DateTimeKind.Utc);
                    }

                    detail.Gender = p.Gender == 1 ? "Male" : p.Gender == 2 ? "Female" : "Other";
                    detail.Nationality = p.IsNepali ? "Nepali" : p.OtherNationality ?? "";
                    detail.CitizenshipNumber = p.CitizenshipNo;
                    detail.CitizenshipIssuedDistrict = p.CitizenshipIssueDistrict;

                    if (p.CitizenshipIssueDate.HasValue)
                    {
                        detail.CitizenshipIssuedDate =
                            DateTime.SpecifyKind(p.CitizenshipIssueDate.Value, DateTimeKind.Utc);
                    }

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
                    detail.OrganizationAddress = o.OrganizationAddress;
                    detail.Designation = o.Designation;
                    detail.AnnualIncome = o.AnnualIncomeRange;
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

            detail.UpdatedAt = DateTime.UtcNow;
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

            // WebRootPath can be null if wwwroot folder doesn't exist
            var wwwRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var uploadsRoot = Path.Combine(wwwRoot, "uploads", "kyc", sessionId.ToString());

            if (!Directory.Exists(uploadsRoot))
                Directory.CreateDirectory(uploadsRoot);

            var safeFileName = Path.GetFileNameWithoutExtension(fileName);
            var ext = Path.GetExtension(fileName);
            if (string.IsNullOrEmpty(ext)) ext = ".dat"; // Fallback ext

            var uniqueName = $"{documentType}_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadsRoot, uniqueName);
            await File.WriteAllBytesAsync(filePath, content);

            var doc = new KycDocument
            {
                KycDetailId = detail.Id,
                DocumentType = documentType,
                OriginalFileName = fileName,
                Data = content, // Storing binary data in database
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

        public async Task<KycFormSession> GetOrCreateSessionAsync(string? userId, string? email)
        {
            if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(email))
                throw new ArgumentException("Both userId and email cannot be null or empty.");

            var session = await _context.KycFormSessions
                .Include(s => s.KycDetail)
                .Include(s => s.StepCompletions)
                .FirstOrDefaultAsync(s =>
                    (userId != null && s.UserId == userId) || (email != null && s.Email == email));

            if (session == null)
            {
                if (string.IsNullOrEmpty(email))
                    throw new ArgumentException("Email is required to create a new session.");

                session = new KycFormSession
                {
                    UserId = userId,
                    Email = email,
                    SessionExpiryDate = DateTime.UtcNow.AddDays(30),
                    CurrentStep = 1,
                    EmailVerified = false
                };
                await _context.KycFormSessions.AddAsync(session);
                await _context.SaveChangesAsync();

                // Seed steps for new session
                var steps = await _context.KycFormSteps.Where(s => s.IsActive).ToListAsync();
                foreach (var step in steps)
                {
                    await _context.KycStepCompletions.AddAsync(new KycStepCompletion
                    {
                        SessionId = session.Id,
                        StepNumber = step.StepNumber
                    });
                }

                await _context.SaveChangesAsync();
            }
            else if (session.UserId == null && !string.IsNullOrEmpty(userId))
            {
                // Link session if it was previously created via guest email flow and user is now logged in
                session.UserId = userId;
                if (!string.IsNullOrEmpty(email))
                    session.Email =
                        email; // Update email to current user's email if different? Usually keep original or update.
                await _context.SaveChangesAsync();
            }

            return session;
        }
    }
}
