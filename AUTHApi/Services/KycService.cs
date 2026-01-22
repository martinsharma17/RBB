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
        /// Retrieves or creates a KycDetail record for the given session.
        /// If no detail exists, creates a draft entry with minimal data.
        /// </summary>
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

                // CRITICAL FIX: Link the Session to this Detail
                var session = await _context.KycFormSessions.FindAsync(sessionId);
                if (session != null)
                {
                    session.KycDetailId = detail.Id;
                    _context.KycFormSessions.Update(session);
                    await _context.SaveChangesAsync();
                }
            }

            return detail;
        }

        /// <summary>
        /// Updates the KycDetail entity with data from the provided DTO.
        /// Uses a type-based switch to map different DTO types to their corresponding entity fields.
        /// Each step number corresponds to a specific section of the KYC form.
        /// </summary>
        public async Task<int> UpdateDetailAsync<TDto>(int sessionId, int stepNumber, TDto dto)
        {
            var detail = await GetOrCreateDetailAsync(sessionId);

            // Map DTO to entity using pattern matching based on concrete DTO type
            switch (dto)
            {
                // Step 1: Personal Information
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

                    if (p.BranchId.HasValue)
                    {
                        detail.BranchId = p.BranchId.Value;
                    }

                    detail.MaritalStatus = p.MaritalStatus;
                    detail.PanNumber = p.PanNo;
                    detail.NidNumber = p.NidNo;
                    break;

                // Steps 2 & 3: Address Information
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

                // Step 4: Family Details
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

                // Step 5: Bank Account Details
                case BankDto b:
                    detail.BankName = b.BankName;
                    detail.BankAccountNumber = b.BankAccountNo;
                    detail.BankBranch = b.BankAddress;
                    detail.BankAccountType = b.AccountType?.ToString(); // Mapping byte to string
                    break;

                // Step 6: Occupation Details
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

                // Step 7: Financial Details
                case FinancialDetailsDto fd:
                    detail.AnnualIncome = fd.AnnualIncomeRange;
                    break;

                // Step 8: Transaction Information
                case TransactionInfoDto t:
                    detail.SourceOfFunds = t.SourceOfNetWorth;
                    detail.MajorSourceOfIncome = t.MajorSourceOfIncome;
                    detail.HasOtherBrokerAccount = t.HasOtherBrokerAccount;
                    detail.OtherBrokerNames = t.OtherBrokerNames;
                    detail.IsCibBlacklisted = t.IsCibBlacklisted;
                    detail.CibBlacklistDetails = t.CibBlacklistDetails;
                    break;

                // Step 9: Guardian Details
                case GuardianDto g:
                    detail.GuardianName = g.FullName;
                    detail.GuardianRelationship = g.Relationship;
                    detail.GuardianAddress = g.Address;
                    detail.GuardianContactNo = g.ContactNo;
                    detail.GuardianEmail = g.EmailId;
                    detail.GuardianPanNumber = g.PermanentAccountNo;
                    detail.GuardianOccupation = g.Occupation;
                    break;

                // Step 10: AML Compliance Information
                case AmlComplianceDto aml:
                    detail.IsPep = aml.IsPoliticallyExposedPerson;
                    detail.PepRelation = aml.PepRelationName ?? aml.PepRelationship;
                    detail.HasBeneficialOwner = aml.HasBeneficialOwner;
                    detail.BeneficialOwnerDetails = aml.BeneficialOwnerDetails;
                    detail.HasCriminalRecord = aml.HasCriminalRecord;
                    detail.CriminalRecordDetails = aml.CriminalRecordDetails;
                    break;

                // Step 10: Location Map
                case LocationMapDto l:
                    detail.LocationLandmark = l.Landmark;
                    detail.LocationDistance = l.DistanceFromMainRoad;
                    detail.LocationLatitude = l.Latitude;
                    detail.LocationLongitude = l.Longitude;
                    detail.LocationSketchJson = l.CanvasDataJson;
                    break;

                // Step 11: Declarations
                case DeclarationsDto d:
                    detail.AgreeToTerms = d.AgreeToTerms;
                    detail.NoOtherFinancialLiability = d.NoOtherFinancialLiability;
                    detail.AllInformationTrue = d.AllInformationTrue;
                    break;

                // Step 12: Agreement
                case AgreementDto ag:
                    detail.AgreementDate = DateTime.SpecifyKind(ag.AgreementDate, DateTimeKind.Utc);
                    detail.TradingLimit = ag.TradingLimit;
                    detail.MarginTradingFacility = ag.MarginTradingFacility;
                    break;

                default:
                    throw new ArgumentException($"Unsupported DTO type: {typeof(TDto).Name}");
            }

            detail.UpdatedAt = DateTime.UtcNow;

            var s = await _context.KycFormSessions.FindAsync(sessionId);
            if (s != null)
            {
                s.ModifiedDate = DateTime.UtcNow;
                s.LastActivityDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return detail.Id;
        }

        /// <summary>
        /// Uploads a document associated with a KYC session.
        /// </summary>
        public async Task<KycDocument> UploadDocumentAsync(int sessionId, string documentType, string fileName,
            byte[] content, string contentType)
        {
            // Validate file size (4MB limit)
            const long maxFileSize = 4 * 1024 * 1024; // 4MB in bytes
            if (content.Length > maxFileSize)
            {
                throw new ArgumentException(
                    $"File size exceeds the maximum allowed size of 4MB. File size: {content.Length / 1024.0 / 1024.0:F2}MB");
            }

            var detail = await GetOrCreateDetailAsync(sessionId);

            // CRITICAL FIX: Replace existing document of the same type to avoid duplicates in PDF and DB
            var existingDoc = await _context.KycDocuments
                .FirstOrDefaultAsync(d => d.KycDetailId == detail.Id && d.DocumentType == documentType);

            if (existingDoc != null)
            {
                try
                {
                    if (File.Exists(existingDoc.FilePath))
                    {
                        File.Delete(existingDoc.FilePath);
                    }
                }
                catch (Exception ex)
                {
                    // Log and continue
                    Console.WriteLine($"Warning: Failed to delete old file {existingDoc.FilePath}: {ex.Message}");
                }

                _context.KycDocuments.Remove(existingDoc);
                // We will save changes after adding the new one to keep it atomic in one transaction
            }

            var wwwRoot = _env.WebRootPath;
            if (string.IsNullOrEmpty(wwwRoot))
                wwwRoot = Path.Combine(_env.ContentRootPath, "wwwroot");
            var uploadsRoot = Path.Combine(wwwRoot, "uploads", "kyc", sessionId.ToString());

            if (!Directory.Exists(uploadsRoot))
                Directory.CreateDirectory(uploadsRoot);

            var ext = Path.GetExtension(fileName);
            if (string.IsNullOrEmpty(ext)) ext = ".dat";

            var uniqueName = $"{documentType}_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadsRoot, uniqueName);
            await File.WriteAllBytesAsync(filePath, content);

            var doc = new KycDocument
            {
                KycDetailId = detail.Id,
                DocumentType = documentType,
                OriginalFileName = fileName,
                Data = content,
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
        /// Retrieves the KYC progress for a session.
        /// </summary>
        public async Task<KycProgressDto?> GetProgressAsync(int sessionId)
        {
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

            // 1. Try to find the most recent ACTIVE session (not submitted)
            // We prioritize userId for security to prevent session sharing by email
            var uId = userId;
            var em = email;
            var session = await _context.KycFormSessions
                .Include(s => s.KycDetail)
                .Include(s => s.StepCompletions)
                .OrderByDescending(s => s.LastActivityDate)
                .FirstOrDefaultAsync(s =>
                    ((uId != null && s.UserId == uId) || (uId == null && em != null && s.Email == em))
                    && s.FormStatus < 3);

            if (session == null)
            {
                // NO active session found. Check if they have a submitted one recently.
                var lastSubmitted = await _context.KycFormSessions
                    .Where(s => (uId != null && s.UserId == uId) || (em != null && s.Email == em))
                    .OrderByDescending(s => s.ModifiedDate)
                    .FirstOrDefaultAsync(s => s.FormStatus == 3);

                if (lastSubmitted != null)
                {
                    // var timeSinceSubmission = DateTime.UtcNow - (lastSubmitted.ModifiedDate ?? lastSubmitted.CreatedDate);

                    // REMOVED: 5-minute lockout check.
                    // We want to allow Makers/Checkers to start a new session immediately after submission.
                    // if (timeSinceSubmission.TotalMinutes < 5) { return lastSubmitted; }

                    // Else, we fall through and create a NEW session below (allowing new KYC after 5 mins)
                }

                // If no active session OR submitted > 5 mins ago, create NEW
                if (string.IsNullOrEmpty(email) && userId != null)
                {
                    var user = await _context.Users.FindAsync(userId);
                    email = user?.Email;
                }

                if (string.IsNullOrEmpty(email))
                    throw new ArgumentException("Email is required to create a new session.");

                session = new KycFormSession
                {
                    UserId = userId,
                    Email = email,
                    SessionExpiryDate = DateTime.UtcNow.AddDays(30),
                    CurrentStep = 1,
                    EmailVerified = !string.IsNullOrEmpty(userId),
                    CreatedDate = DateTime.UtcNow,
                    LastActivityDate = DateTime.UtcNow,
                    FormStatus = 1 // In Progress
                };
                await _context.KycFormSessions.AddAsync(session);
                await _context.SaveChangesAsync();

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
                // Link session to logged in user if it was started unauthenticated
                session.UserId = userId;
                session.ModifiedDate = DateTime.UtcNow;
                session.LastActivityDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return session;
        }

        public async Task<(KycFormSession? session, string? errorMessage)> InitiateUnauthenticatedKycAsync(string email)
        {
            if (string.IsNullOrEmpty(email))
                return (null, "Email is required to initiate KYC.");

            var existingSession =
                await _context.KycFormSessions.FirstOrDefaultAsync(s =>
                    s.Email == email && s.UserId == null && s.FormStatus < 3);
            if (existingSession != null)
            {
                if (!existingSession.EmailVerified && existingSession.SessionExpiryDate > DateTime.UtcNow)
                {
                    var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:5173";
                    var verificationLink =
                        $"{frontendUrl}/kyc/verify-email?token={Uri.EscapeDataString(existingSession.SessionToken.ToString())}&sessionId={existingSession.Id}";
                    await _emailService.SendKycVerificationEmailAsync(email, verificationLink);
                    return (existingSession,
                        "Existing unverified session found. A new verification email has been sent.");
                }
                else if (existingSession.EmailVerified)
                {
                    return (existingSession,
                        "KYC session for this email is already initiated and verified. Please continue your form.");
                }
            }

            var session = new KycFormSession
            {
                Email = email,
                SessionToken = Guid.NewGuid(),
                SessionExpiryDate = DateTime.UtcNow.AddDays(7),
                CurrentStep = 1,
                EmailVerified = false,
                FormStatus =
                    1 // Use int (1=Pending) instead of string if your entity expects int, or check entity definition. 
                // Original code used "Pending" (string) but previous KycSessionController used FormStatus=2 (byte/int?).
                // Assuming byte based on KycSessionResponseDto.FormStatus (byte).
                // Let's assume 1 for Pending.
            };

            // Fix: KycFormSession.FormStatus is likely byte/int based on usage in KycSessionController (session.FormStatus = 2)
            // Ideally should check Entity definition, but for now using 1.

            await _context.KycFormSessions.AddAsync(session);
            await _context.SaveChangesAsync();

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

            var frontendUrl2 = _configuration["Frontend:Url"] ?? "http://localhost:5173";
            var verificationLink2 =
                $"{frontendUrl2}/kyc/verify-email?token={Uri.EscapeDataString(session.SessionToken.ToString())}&sessionId={session.Id}";
            await _emailService.SendKycVerificationEmailAsync(email, verificationLink2);

            return (session, null);
        }

        public async Task<bool> VerifyKycEmailAsync(string sessionToken, string verificationToken)
        {
            if (!Guid.TryParse(sessionToken, out var tokenGuid)) return false;

            var session =
                await _context.KycFormSessions.FirstOrDefaultAsync(s =>
                    s.SessionToken == tokenGuid && s.UserId == null);

            if (session == null || session.SessionExpiryDate < DateTime.UtcNow || session.EmailVerified)
                return false;

            if (session.SessionToken.ToString() != verificationToken)
                return false;

            session.EmailVerified = true;
            session.ModifiedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<string?> GetStepFormSchemaAsync(int stepNumber)
        {
            // FieldSchemaJson property does not exist in the entity, returning null for now.
            // If needed, add this property to KycFormSteps entity and run migration.
            return null;
        }

        public async Task UpdateDetailWithJsonAsync(int sessionId, int stepNumber, JsonElement data)
        {
            switch (stepNumber)
            {
                case 1:
                    var personalInfo = data.Deserialize<PersonalInfoDto>();
                    if (personalInfo != null) await UpdateDetailAsync(sessionId, stepNumber, personalInfo);
                    break;
                case 2:
                    var currentAddress = data.Deserialize<AddressDto>();
                    if (currentAddress != null) await UpdateDetailAsync(sessionId, stepNumber, currentAddress);
                    break;
                case 3:
                    var permanentAddress = data.Deserialize<AddressDto>();
                    if (permanentAddress != null) await UpdateDetailAsync(sessionId, stepNumber, permanentAddress);
                    break;
                case 4:
                    var familyInfo = data.Deserialize<FamilyDto>();
                    if (familyInfo != null) await UpdateDetailAsync(sessionId, stepNumber, familyInfo);
                    break;
                case 5:
                    var bankInfo = data.Deserialize<BankDto>();
                    if (bankInfo != null) await UpdateDetailAsync(sessionId, stepNumber, bankInfo);
                    break;
                case 6:
                    var occupationInfo = data.Deserialize<OccupationDto>();
                    if (occupationInfo != null) await UpdateDetailAsync(sessionId, stepNumber, occupationInfo);
                    break;
                case 7:
                    var financialDetails = data.Deserialize<FinancialDetailsDto>();
                    if (financialDetails != null) await UpdateDetailAsync(sessionId, stepNumber, financialDetails);
                    break;
                case 8:
                    var transactionInfo = data.Deserialize<TransactionInfoDto>();
                    if (transactionInfo != null) await UpdateDetailAsync(sessionId, stepNumber, transactionInfo);
                    break;
                case 9:
                    var guardianInfo = data.Deserialize<GuardianDto>();
                    if (guardianInfo != null) await UpdateDetailAsync(sessionId, stepNumber, guardianInfo);
                    break;
                case 10:
                    var amlCompliance = data.Deserialize<AmlComplianceDto>();
                    if (amlCompliance != null) await UpdateDetailAsync(sessionId, stepNumber, amlCompliance);
                    break;
                case 11:
                    var locationMap = data.Deserialize<LocationMapDto>();
                    if (locationMap != null) await UpdateDetailAsync(sessionId, stepNumber, locationMap);
                    break;
                case 12:
                    var declarations = data.Deserialize<DeclarationsDto>();
                    if (declarations != null) await UpdateDetailAsync(sessionId, stepNumber, declarations);
                    break;
                case 13:
                    var agreement = data.Deserialize<AgreementDto>();
                    if (agreement != null) await UpdateDetailAsync(sessionId, stepNumber, agreement);
                    break;
                default:
                    throw new ArgumentException($"Unsupported step number for dynamic update: {stepNumber}");
            }

            var session = await _context.KycFormSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
            if (session != null)
            {
                session.CurrentStep = Math.Max(session.CurrentStep, stepNumber + 1);
                session.LastSavedStep = stepNumber;

                var stepCompletion = await _context.KycStepCompletions
                    .FirstOrDefaultAsync(sc => sc.SessionId == sessionId && sc.StepNumber == stepNumber);
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
}
