using System.Text.Json;
using AUTHApi.Data;
using AUTHApi.Entities;
using AUTHApi.DTOs;
using Microsoft.EntityFrameworkCore;

namespace AUTHApi.Services
{
    /// <summary>
    /// Concrete implementation of <see cref="IKycService"/>.
    /// Handles all data-access operations for KYC, keeping controllers thin and testable.
    /// This service manages KYC session creation, detail updates, document uploads, and progress tracking.
    /// </summary>
    public class KycService : IKycService
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public KycService(ApplicationDbContext context, IWebHostEnvironment env, IEmailService emailService,
            IConfiguration configuration)
        {
            _context = context;
            _env = env;
            _emailService = emailService;
            _configuration = configuration;
        }

        /// <summary>
        /// Helper to retrieve session by token.
        /// </summary>
        private async Task<KycFormSession> GetSessionByTokenAsync(Guid sessionToken)
        {
            var session = await _context.KycFormSessions.FirstOrDefaultAsync(s => s.SessionToken == sessionToken);
            if (session == null) throw new ArgumentException("KYC session not found.");
            return session;
        }

        /// <summary>
        /// Retrieves or creates a KycDetail record for the given session token.
        /// </summary>
        public async Task<KycDetail> GetOrCreateDetailAsync(Guid sessionToken)
        {
            var session = await GetSessionByTokenAsync(sessionToken);
            var detail = await _context.KycDetails.FirstOrDefaultAsync(k => k.SessionId == session.Id);
            
            if (detail == null)
            {
                detail = new KycDetail
                {
                    SessionId = session.Id,
                    UpdatedAt = DateTime.UtcNow,
                    FirstName = "Draft",
                    LastName = "Draft"
                };
                _context.KycDetails.Add(detail);
                await _context.SaveChangesAsync();

                session.ModifiedDate = DateTime.UtcNow;
                _context.KycFormSessions.Update(session);
                await _context.SaveChangesAsync();
            }

            return detail;
        }

        /// <summary>
        /// Updates the KycDetail entity with data from the provided DTO.
        /// </summary>
        public async Task<int> UpdateDetailAsync<TDto>(Guid sessionToken, int stepNumber, TDto dto)
        {
            var session = await GetSessionByTokenAsync(sessionToken);
            var detail = await GetOrCreateDetailAsync(sessionToken);

            // Map DTO to entity
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
                    if (p.DateOfBirthAd.HasValue) detail.DateOfBirth = DateTime.SpecifyKind(p.DateOfBirthAd.Value, DateTimeKind.Utc);
                    detail.Gender = p.Gender == 1 ? "Male" : p.Gender == 2 ? "Female" : "Other";
                    detail.Nationality = p.IsNepali ? "Nepali" : p.OtherNationality ?? "";
                    detail.CitizenshipNumber = p.CitizenshipNo;
                    detail.CitizenshipIssuedDistrict = p.CitizenshipIssueDistrict;
                    if (p.CitizenshipIssueDate.HasValue) detail.CitizenshipIssuedDate = DateTime.SpecifyKind(p.CitizenshipIssueDate.Value, DateTimeKind.Utc);
                    if (p.BranchId.HasValue) detail.BranchId = p.BranchId.Value;
                    detail.MaritalStatus = p.MaritalStatus;
                    detail.PanNumber = p.PanNo;
                    detail.NidNumber = p.NidNo;
                    break;

                case AddressDto a:
                    if (stepNumber == 2)
                    {
                        detail.CurrentCountry = a.Country;
                        detail.CurrentState = a.Province;
                        detail.CurrentDistrict = a.District;
                        detail.CurrentMunicipality = a.MunicipalityName;
                        detail.CurrentWardNo = a.WardNo?.ToString();
                        detail.CurrentStreet = a.Tole;
                        detail.MobileNumber = a.MobileNo;
                        detail.Email = a.EmailId;
                    }
                    else if (stepNumber == 3)
                    {
                        detail.PermanentCountry = a.Country;
                        detail.PermanentState = a.Province;
                        detail.PermanentDistrict = a.District;
                        detail.PermanentMunicipality = a.MunicipalityName;
                        detail.PermanentWardNo = a.WardNo?.ToString();
                        detail.PermanentStreet = a.Tole;
                        detail.PermanentFullAddress = a.FullAddress;
                    }
                    break;

                case FamilyDto f:
                    detail.FatherName = f.FatherName;
                    detail.MotherName = f.MotherName;
                    detail.GrandFatherName = f.GrandFatherName;
                    detail.SpouseName = f.SpouseName;
                    detail.SonName = f.SonName;
                    detail.DaughterName = f.DaughterName;
                    detail.DaughterInLawName = f.DaughterInLawName;
                    detail.FatherInLawName = f.FatherInLawName;
                    detail.MotherInLawName = f.MotherInLawName;
                    detail.ChildrenNames = f.ChildrenNames;
                    break;

                case BankDto b:
                    detail.BankName = b.BankName;
                    detail.BankAccountNumber = b.BankAccountNo;
                    detail.BankBranch = b.BankAddress;
                    detail.BankAccountType = b.AccountType?.ToString();
                    break;

                case OccupationDto o:
                    detail.Occupation = o.OccupationType;
                    detail.OtherOccupation = o.OtherOccupation;
                    detail.ServiceSector = o.ServiceSector;
                    detail.BusinessType = o.BusinessType;
                    detail.OrganizationName = o.OrganizationName;
                    detail.OrganizationAddress = o.OrganizationAddress;
                    detail.Designation = o.Designation;
                    detail.EmployeeIdNo = o.EmployeeIdNo;
                    detail.AnnualIncome = o.AnnualIncomeRange;
                    break;

                case FinancialDetailsDto fd:
                    detail.AnnualIncome = fd.AnnualIncomeRange;
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
                    detail.GuardianEmail = g.EmailId;
                    detail.GuardianPanNumber = g.PermanentAccountNo;
                    detail.GuardianOccupation = g.Occupation;
                    break;

                case AmlComplianceDto aml:
                    detail.IsPep = aml.IsPoliticallyExposedPerson;
                    detail.PepRelation = aml.PepRelationName ?? aml.PepRelationship;
                    detail.HasBeneficialOwner = aml.HasBeneficialOwner;
                    detail.BeneficialOwnerDetails = aml.BeneficialOwnerDetails;
                    detail.HasCriminalRecord = aml.HasCriminalRecord;
                    detail.CriminalRecordDetails = aml.CriminalRecordDetails;
                    break;

                case LocationMapDto l:
                    detail.LocationLandmark = l.Landmark;
                    detail.LocationDistance = l.DistanceFromMainRoad;
                    detail.LocationLatitude = l.Latitude;
                    detail.LocationLongitude = l.Longitude;
                    detail.LocationSketchJson = l.CanvasDataJson;
                    break;

                case DeclarationsDto d:
                    detail.AgreeToTerms = d.AgreeToTerms;
                    detail.NoOtherFinancialLiability = d.NoOtherFinancialLiability;
                    detail.AllInformationTrue = d.AllInformationTrue;
                    break;

                case AgreementDto ag:
                    detail.AgreementDate = DateTime.SpecifyKind(ag.AgreementDate, DateTimeKind.Utc);
                    detail.TradingLimit = ag.TradingLimit;
                    detail.MarginTradingFacility = ag.MarginTradingFacility;
                    break;

                default:
                    throw new ArgumentException($"Unsupported DTO type: {typeof(TDto).Name}");
            }

            detail.UpdatedAt = DateTime.UtcNow;
            session.ModifiedDate = DateTime.UtcNow;
            session.LastActivityDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return detail.Id;
        }

        /// <summary>
        /// Uploads a document securely to a non-public folder (App_Data/Uploads).
        /// </summary>
        public async Task<KycDocument> UploadDocumentAsync(Guid sessionToken, string documentType, string fileName,
            byte[] content, string contentType)
        {
            var session = await GetSessionByTokenAsync(sessionToken);
            var detail = await GetOrCreateDetailAsync(sessionToken);

            // Replace existing document of the same type
            var existingDoc = await _context.KycDocuments
                .FirstOrDefaultAsync(d => d.KycDetailId == detail.Id && d.DocumentType == documentType);

            if (existingDoc != null)
            {
                if (File.Exists(existingDoc.FilePath)) File.Delete(existingDoc.FilePath);
                _context.KycDocuments.Remove(existingDoc);
            }

            // Secure Storage Path (Outside wwwroot)
            var storagePath = Path.Combine(_env.ContentRootPath, "App_Data", "Uploads", "kyc", session.Id.ToString());
            if (!Directory.Exists(storagePath)) Directory.CreateDirectory(storagePath);

            var ext = Path.GetExtension(fileName) ?? ".dat";
            var uniqueName = $"{documentType}_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(storagePath, uniqueName);
            
            await File.WriteAllBytesAsync(filePath, content);

            var doc = new KycDocument
            {
                KycDetailId = detail.Id,
                DocumentType = documentType,
                OriginalFileName = fileName,
                Data = content, // Keeping Data in DB for now for legacy compatibility, but redundant if filePath is used.
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

        /// <summary>
        /// Retrieves the KYC progress for a session token.
        /// </summary>
        public async Task<KycProgressDto?> GetProgressAsync(Guid sessionToken)
        {
            var session = await _context.KycFormSessions.FirstOrDefaultAsync(s => s.SessionToken == sessionToken);
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
                        sc.SessionId == session.Id && sc.StepNumber == s.StepNumber && sc.IsCompleted),
                    IsSaved = _context.KycStepCompletions.Any(sc =>
                        sc.SessionId == session.Id && sc.StepNumber == s.StepNumber && sc.IsSaved),
                    SavedDate = _context.KycStepCompletions
                        .Where(sc => sc.SessionId == session.Id && sc.StepNumber == s.StepNumber && sc.IsSaved)
                        .Select(sc => sc.SavedDate)
                        .FirstOrDefault(),
                    RecordId = _context.KycStepCompletions
                        .Where(sc => sc.SessionId == session.Id && sc.StepNumber == s.StepNumber)
                        .Select(sc => sc.RecordId)
                        .FirstOrDefault()
                })
                .ToListAsync();

            return new KycProgressDto
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
        }

        public async Task<KycFormSession> GetOrCreateSessionAsync(string? userId, string? email)
        {
            if (string.IsNullOrEmpty(userId) && string.IsNullOrEmpty(email))
                throw new ArgumentException("Both userId and email cannot be null or empty.");

            var session = await _context.KycFormSessions
                .Include(s => s.KycDetail)
                .OrderByDescending(s => s.LastActivityDate)
                .FirstOrDefaultAsync(s =>
                    ((userId != null && s.UserId == userId) || (userId == null && email != null && s.Email == email))
                    && s.FormStatus < 3);

            if (session == null)
            {
                if (string.IsNullOrEmpty(email) && userId != null)
                {
                    var user = await _context.Users.FindAsync(userId);
                    email = user?.Email;
                }

                if (string.IsNullOrEmpty(email)) throw new ArgumentException("Email is required.");

                session = new KycFormSession
                {
                    UserId = userId,
                    Email = email,
                    SessionToken = Guid.NewGuid(), // Ensure token is generated
                    SessionExpiryDate = DateTime.UtcNow.AddDays(30),
                    CurrentStep = 1,
                    EmailVerified = !string.IsNullOrEmpty(userId),
                    CreatedDate = DateTime.UtcNow,
                    LastActivityDate = DateTime.UtcNow,
                    FormStatus = 1
                };
                await _context.KycFormSessions.AddAsync(session);
                await _context.SaveChangesAsync();

                var steps = await _context.KycFormSteps.Where(st => st.IsActive).ToListAsync();
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
                session.UserId = userId;
                await _context.SaveChangesAsync();
            }

            return session;
        }
        
        // ... InitiateUnauthenticatedKycAsync and VerifyKycEmailAsync remain Guid-safe already ...
        
        public async Task<(KycFormSession? session, string? errorMessage)> InitiateUnauthenticatedKycAsync(string email)
        {
            if (string.IsNullOrEmpty(email)) return (null, "Email is required.");

            var existingSession = await _context.KycFormSessions.FirstOrDefaultAsync(s => s.Email == email && s.UserId == null && s.FormStatus < 3);
            if (existingSession != null)
            {
                if (!existingSession.EmailVerified && existingSession.SessionExpiryDate > DateTime.UtcNow)
                {
                    var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
                    var verificationLink = $"{frontendUrl}/kyc/verify-email?token={existingSession.SessionToken}&sessionId={existingSession.Id}";
                    await _emailService.SendKycVerificationEmailAsync(email, verificationLink);
                    return (existingSession, "New verification email sent.");
                }
                return (existingSession, "Session already active.");
            }

            var session = new KycFormSession
            {
                Email = email,
                SessionToken = Guid.NewGuid(),
                SessionExpiryDate = DateTime.UtcNow.AddDays(7),
                CurrentStep = 1,
                FormStatus = 1
            };

            await _context.KycFormSessions.AddAsync(session);
            await _context.SaveChangesAsync();

            var steps = await _context.KycFormSteps.Where(st => st.IsActive).ToListAsync();
            foreach (var step in steps)
            {
                await _context.KycStepCompletions.AddAsync(new KycStepCompletion
                {
                    SessionId = session.Id,
                    StepNumber = step.StepNumber
                });
            }
            await _context.SaveChangesAsync();

            var frontendUrl2 = _configuration["Frontend:Url"] ?? "http://localhost:5173";
            var verificationLink2 = $"{frontendUrl2}/kyc/verify-email?token={session.SessionToken}&sessionId={session.Id}";
            await _emailService.SendKycVerificationEmailAsync(email, verificationLink2);

            return (session, null);
        }

        public async Task<bool> VerifyKycEmailAsync(string sessionToken, string verificationToken)
        {
            if (!Guid.TryParse(sessionToken, out var tokenGuid)) return false;
            var session = await _context.KycFormSessions.FirstOrDefaultAsync(s => s.SessionToken == tokenGuid && s.UserId == null);
            if (session == null || session.SessionExpiryDate < DateTime.UtcNow || session.EmailVerified) return false;
            if (session.SessionToken.ToString() != verificationToken) return false;

            session.EmailVerified = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<string?> GetStepFormSchemaAsync(int stepNumber) => null;

        public async Task UpdateDetailWithJsonAsync(Guid sessionToken, int stepNumber, JsonElement data)
        {
            var session = await GetSessionByTokenAsync(sessionToken);
            
            switch (stepNumber)
            {
                case 1: var p = data.Deserialize<PersonalInfoDto>(); if (p != null) await UpdateDetailAsync(sessionToken, stepNumber, p); break;
                case 2: var ca = data.Deserialize<AddressDto>(); if (ca != null) await UpdateDetailAsync(sessionToken, stepNumber, ca); break;
                case 3: var pa = data.Deserialize<AddressDto>(); if (pa != null) await UpdateDetailAsync(sessionToken, stepNumber, pa); break;
                case 4: var f = data.Deserialize<FamilyDto>(); if (f != null) await UpdateDetailAsync(sessionToken, stepNumber, f); break;
                case 5: var b = data.Deserialize<BankDto>(); if (b != null) await UpdateDetailAsync(sessionToken, stepNumber, b); break;
                case 6: var o = data.Deserialize<OccupationDto>(); if (o != null) await UpdateDetailAsync(sessionToken, stepNumber, o); break;
                case 7: var fd = data.Deserialize<FinancialDetailsDto>(); if (fd != null) await UpdateDetailAsync(sessionToken, stepNumber, fd); break;
                case 8: var t = data.Deserialize<TransactionInfoDto>(); if (t != null) await UpdateDetailAsync(sessionToken, stepNumber, t); break;
                case 9: var g = data.Deserialize<GuardianDto>(); if (g != null) await UpdateDetailAsync(sessionToken, stepNumber, g); break;
                case 10: var aml = data.Deserialize<AmlComplianceDto>(); if (aml != null) await UpdateDetailAsync(sessionToken, stepNumber, aml); break;
                case 11: var l = data.Deserialize<LocationMapDto>(); if (l != null) await UpdateDetailAsync(sessionToken, stepNumber, l); break;
                case 12: var d = data.Deserialize<DeclarationsDto>(); if (d != null) await UpdateDetailAsync(sessionToken, stepNumber, d); break;
                case 13: var ag = data.Deserialize<AgreementDto>(); if (ag != null) await UpdateDetailAsync(sessionToken, stepNumber, ag); break;
                default: throw new ArgumentException("Invalid step.");
            }

            session.CurrentStep = Math.Max(session.CurrentStep, stepNumber + 1);
            session.LastSavedStep = stepNumber;

            var stepCompletion = await _context.KycStepCompletions
                .FirstOrDefaultAsync(sc => sc.SessionId == session.Id && sc.StepNumber == stepNumber);
            if (stepCompletion != null)
            {
                stepCompletion.IsSaved = true;
                stepCompletion.SavedDate = DateTime.UtcNow;
                stepCompletion.IsCompleted = true;
                stepCompletion.CompletedDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }
    }
}
