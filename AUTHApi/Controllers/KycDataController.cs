using AUTHApi.Data;
using AUTHApi.DTOs;
using AUTHApi.Entities;
using AUTHApi.Services;
using AUTHApi.Core.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace AUTHApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    
    public class KycDataController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly IKycService _kycService;

        public KycDataController(ApplicationDbContext context, IKycService kycService)
        {
            _context = context;
            _kycService = kycService;
        }

        // ==========================================
        // FETCH ENDPOINTS (AGGREGATED)
        // ==========================================

        /// <summary>
        /// Retrieves all KYC details for a specific session.
        /// Validates session token and ownership.
        /// </summary>
        [HttpGet("all-details/{sessionToken}")]
        public async Task<IActionResult> GetAllDetails(Guid sessionToken)
        {
            var (isValid, msg, session) = await ValidateSessionAsync(sessionToken);
            if (!isValid) return Failure(msg);

            // Fetch the Single consolidated record
            var detail = await _context.KycDetails
                .Include(k => k.Documents)
                .FirstOrDefaultAsync(k => k.SessionId == session!.Id);

            if (detail == null)
            {
                // Return empty structure if not created yet
                return Success(new KycFullDetailsDto
                    { SessionId = session!.Id, Email = session!.Email, CurrentStep = session.CurrentStep });
            }

            // Map Entity -> DTO
            var response = new KycFullDetailsDto
            {
                SessionId = session!.Id,
                Email = session!.Email,
                CurrentStep = session.CurrentStep,
                PersonalInfo = new PersonalInfoDto
                {
                    FirstName = detail.FirstName,
                    MiddleName = detail.MiddleName,
                    LastName = detail.LastName,
                    FullName = detail.FirstName + " " +
                               (string.IsNullOrEmpty(detail.MiddleName) ? "" : detail.MiddleName + " ") +
                               detail.LastName,
                    DateOfBirthAd = detail.DateOfBirth,
                    Gender = detail.Gender == "Male" ? (byte)1 : (detail.Gender == "Female" ? (byte)2 : (byte)3),
                    IsNepali = detail.Nationality == "Nepali",
                    OtherNationality = detail.Nationality != "Nepali" ? detail.Nationality : null,
                    CitizenshipNo = detail.CitizenshipNumber,
                    CitizenshipIssueDistrict = detail.CitizenshipIssuedDistrict,
                    CitizenshipIssueDate = detail.CitizenshipIssuedDate,
                    BranchId = detail.BranchId,
                    PanNo = detail.PanNumber,
                    MaritalStatus = detail.MaritalStatus,
                    NidNo = detail.NidNumber
                },
                CurrentAddress = new AddressDto
                {
                    Province = detail.CurrentState,
                    District = detail.CurrentDistrict,
                    MunicipalityName = detail.CurrentMunicipality,
                    WardNo = int.TryParse(detail.CurrentWardNo, out var currentWard) ? currentWard : null,
                    Tole = detail.CurrentStreet,
                    Country = detail.CurrentCountry ?? "Nepal",
                    MobileNo = detail.MobileNumber ?? string.Empty
                },
                PermanentAddress = new AddressDto
                {
                    Province = detail.PermanentState,
                    District = detail.PermanentDistrict,
                    MunicipalityName = detail.PermanentMunicipality,
                    WardNo = int.TryParse(detail.PermanentWardNo, out var permWard) ? permWard : null,
                    Tole = detail.PermanentStreet,
                    Country = detail.PermanentCountry ?? "Nepal",
                    FullAddress = detail.PermanentFullAddress
                },
                Family = new FamilyDto
                {
                    FatherName = detail.FatherName,
                    MotherName = detail.MotherName,
                    GrandFatherName = detail.GrandFatherName,
                    SpouseName = detail.SpouseName,
                    SonName = detail.SonName,
                    DaughterName = detail.DaughterName,
                    DaughterInLawName = detail.DaughterInLawName,
                    FatherInLawName = detail.FatherInLawName,
                    MotherInLawName = detail.MotherInLawName,
                    ChildrenNames = detail.ChildrenNames
                },
                Bank = new BankDto
                {
                    BankName = detail.BankName ?? string.Empty,
                    BankAccountNo = detail.BankAccountNumber ?? string.Empty,
                    BankAddress = detail.BankBranch,
                    AccountType = byte.TryParse(detail.BankAccountType, out var accType) ? accType : null
                },
                Occupation = new OccupationDto
                {
                    OccupationType = detail.Occupation,
                    OtherOccupation = detail.OtherOccupation,
                    ServiceSector = detail.ServiceSector,
                    BusinessType = detail.BusinessType,
                    OrganizationName = detail.OrganizationName,
                    OrganizationAddress = detail.OrganizationAddress,
                    Designation = detail.Designation,
                    EmployeeIdNo = detail.EmployeeIdNo,
                    AnnualIncomeRange = detail.AnnualIncome
                },
                FinancialDetails = new FinancialDetailsDto
                {
                    EstimatedAnnualIncome = detail.AnnualIncome,
                    AnnualIncomeRange = detail.AnnualIncome
                },
                Guardian = new GuardianDto
                {
                    FullName = detail.GuardianName ?? string.Empty,
                    Relationship = detail.GuardianRelationship ?? string.Empty,
                    Address = detail.GuardianAddress,
                    ContactNo = detail.GuardianContactNo,
                    EmailId = detail.GuardianEmail,
                    PermanentAccountNo = detail.GuardianPanNumber,
                    Occupation = detail.GuardianOccupation
                },
                AmlCompliance = new AmlComplianceDto
                {
                    IsPoliticallyExposedPerson = detail.IsPep,
                    PepRelationName = detail.PepRelation,
                    HasBeneficialOwner = detail.HasBeneficialOwner,
                    BeneficialOwnerDetails = detail.BeneficialOwnerDetails,
                    HasCriminalRecord = detail.HasCriminalRecord,
                    CriminalRecordDetails = detail.CriminalRecordDetails
                },
                Attachments = detail.Documents.Select(d => new KycAttachmentDto
                {
                    Id = d.Id,
                    DocumentType = (byte)(d.DocumentType == "Photo" ? 1 :
                        d.DocumentType == "CitizenshipFront" ? 2 :
                        d.DocumentType == "CitizenshipBack" ? 3 :
                        d.DocumentType == "Signature" ? 4 :
                        d.DocumentType == "LeftThumb" ? 5 :
                        d.DocumentType == "RightThumb" ? 6 :
                        d.DocumentType == "LocationMap" ? 10 : 0),
                    DocumentName = d.OriginalFileName,
                    FilePath = $"/api/KycData/document/{d.Id}", // URL for the frontend to fetch the image
                    MimeType = d.ContentType,
                    FileSize = d.FileSize
                }).ToList(),
                LocationMap = new LocationMapDto
                {
                    Landmark = detail.LocationLandmark,
                    DistanceFromMainRoad = detail.LocationDistance,
                    Latitude = detail.LocationLatitude,
                    Longitude = detail.LocationLongitude,
                    CanvasDataJson = detail.LocationSketchJson
                },
                Declarations = new DeclarationsDto
                {
                    AgreeToTerms = detail.AgreeToTerms,
                    NoOtherFinancialLiability = detail.NoOtherFinancialLiability,
                    AllInformationTrue = detail.AllInformationTrue
                },
                Agreement = new AgreementDto
                {
                    AgreementDate = detail.AgreementDate ?? DateTime.Now,
                    TradingLimit = detail.TradingLimit,
                    MarginTradingFacility = detail.MarginTradingFacility
                }
            };

            return Success(response);
        }

        [HttpGet("reverse-geocode")]
        public async Task<IActionResult> ReverseGeocode(string lat, string lon)
        {
            try
            {
                using (var client = new HttpClient())
                {
                    // Nominatim requires a User-Agent
                    client.DefaultRequestHeaders.Add("User-Agent", "AUTH-KYC-App");
                    var url =
                        $"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lon}&zoom=18&addressdetails=1";
                    var response = await client.GetAsync(url);
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        return Content(content, "application/json");
                    }

                    return Failure("Failed to fetch address from Nominatim", (int)response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                return Failure("Error during geocoding: " + ex.Message, 500);
            }
        }

        // ==========================================
        // SUBMIT ENDPOINTS (CONSOLIDATED)
        // ==========================================

        /// <summary>
        /// Save personal information for a KYC session.
        /// </summary>
        /// <param name="sessionToken">The session token passed via URL.</param>
        /// <param name="model">DTO containing personal info.</param>
        /// <returns>Success envelope with the KycDetail record id.</returns>
        [RequireKycSessionOrAuth] // Dual-token security: Validates JWT OR (sessionToken + X-KYC-Verification header)
        [HttpPost("save-personal-info/{sessionToken}")]
        public async Task<IActionResult> SavePersonalInfo([FromRoute] Guid sessionToken, [FromBody] SaveStepDto<PersonalInfoDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(sessionToken);
            if (!isValid) return Failure(msg);

            var recordId = await _kycService.UpdateDetailAsync(sessionToken, 1, model.Data);
            await UpdateStepProgress(sessionToken, 1, recordId);
            return Success(new { recordId });
        }

        [RequireKycSessionOrAuth]
        [HttpPost("save-current-address/{sessionToken}")]
        public async Task<IActionResult> SaveCurrentAddress([FromRoute] Guid sessionToken, [FromBody] SaveStepDto<AddressDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(sessionToken);
            if (!isValid) return Failure(msg);
            var recordId = await _kycService.UpdateDetailAsync(sessionToken, 2, model.Data);
            await UpdateStepProgress(sessionToken, 2, recordId);
            return Success(new { recordId });
        }

        [RequireKycSessionOrAuth]
        [HttpPost("save-permanent-address/{sessionToken}")]
        public async Task<IActionResult> SavePermanentAddress([FromRoute] Guid sessionToken, [FromBody] SaveStepDto<AddressDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(sessionToken);
            if (!isValid) return Failure(msg);
            var recordId = await _kycService.UpdateDetailAsync(sessionToken, 3, model.Data);
            await UpdateStepProgress(sessionToken, 3, recordId);
            return Success(new { recordId });
        }

        [RequireKycSessionOrAuth]
        [HttpPost("save-family/{sessionToken}")]
        public async Task<IActionResult> SaveFamily([FromRoute] Guid sessionToken, [FromBody] SaveStepDto<FamilyDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(sessionToken);
            if (!isValid) return Failure(msg);
            var recordId = await _kycService.UpdateDetailAsync(sessionToken, 4, model.Data);
            await UpdateStepProgress(sessionToken, 4, recordId);
            return Success(new { recordId });
        }

        [RequireKycSessionOrAuth]
        [HttpPost("save-bank-account/{sessionToken}")]
        public async Task<IActionResult> SaveBankAccount([FromRoute] Guid sessionToken, [FromBody] SaveStepDto<BankDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(sessionToken);
            if (!isValid) return Failure(msg);
            var recordId = await _kycService.UpdateDetailAsync(sessionToken, 5, model.Data);
            await UpdateStepProgress(sessionToken, 5, recordId);
            return Success(new { recordId });
        }

        [RequireKycSessionOrAuth]
        [HttpPost("save-occupation/{sessionToken}")]
        public async Task<IActionResult> SaveOccupation([FromRoute] Guid sessionToken, [FromBody] SaveStepDto<OccupationDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(sessionToken);
            if (!isValid) return Failure(msg);
            var recordId = await _kycService.UpdateDetailAsync(sessionToken, 6, model.Data);
            await UpdateStepProgress(sessionToken, 6, recordId);
            return Success(new { recordId });
        }

        [RequireKycSessionOrAuth]
        [HttpPost("save-financial-details/{sessionToken}")]
        public async Task<IActionResult> SaveFinancialDetails([FromRoute] Guid sessionToken, [FromBody] SaveStepDto<FinancialDetailsDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(sessionToken);
            if (!isValid) return Failure(msg);
            var recordId = await _kycService.UpdateDetailAsync(sessionToken, 7, model.Data);
            await UpdateStepProgress(sessionToken, 7, recordId);
            return Success(new { recordId });
        }

        [RequireKycSessionOrAuth]
        [HttpPost("save-transaction-info/{sessionToken}")]
        public async Task<IActionResult> SaveTransactionInfo([FromRoute] Guid sessionToken, [FromBody] SaveStepDto<TransactionInfoDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(sessionToken);
            if (!isValid) return Failure(msg);
            var recordId = await _kycService.UpdateDetailAsync(sessionToken, 8, model.Data);
            await UpdateStepProgress(sessionToken, 8, recordId);
            return Success(new { recordId });
        }

        [RequireKycSessionOrAuth]
        [HttpPost("save-guardian/{sessionToken}")]
        public async Task<IActionResult> SaveGuardian([FromRoute] Guid sessionToken, [FromBody] SaveStepDto<GuardianDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(sessionToken);
            if (!isValid) return Failure(msg);
            var recordId = await _kycService.UpdateDetailAsync(sessionToken, 9, model.Data);
            await UpdateStepProgress(sessionToken, 9, recordId);
            return Success(new { recordId });
        }

        [RequireKycSessionOrAuth]
        [HttpPost("save-aml-compliance/{sessionToken}")]
        public async Task<IActionResult> SaveAmlCompliance([FromRoute] Guid sessionToken, [FromBody] SaveStepDto<AmlComplianceDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(sessionToken);
            if (!isValid) return Failure(msg);
            var recordId = await _kycService.UpdateDetailAsync(sessionToken, 10, model.Data);
            await UpdateStepProgress(sessionToken, 10, recordId);
            return Success(new { recordId });
        }

        [RequireKycSessionOrAuth]
        [HttpPost("save-location-map/{sessionToken}")]
        public async Task<IActionResult> SaveLocationMap([FromRoute] Guid sessionToken, [FromBody] SaveStepDto<LocationMapDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(sessionToken);
            if (!isValid) return Failure(msg);
            var recordId = await _kycService.UpdateDetailAsync(sessionToken, 11, model.Data);
            await UpdateStepProgress(sessionToken, 11, recordId);
            return Success(new { recordId });
        }

        [RequireKycSessionOrAuth]
        [HttpPost("save-declarations/{sessionToken}")]
        public async Task<IActionResult> SaveDeclarations([FromRoute] Guid sessionToken, [FromBody] SaveStepDto<DeclarationsDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(sessionToken);
            if (!isValid) return Failure(msg);
            var recordId = await _kycService.UpdateDetailAsync(sessionToken, 12, model.Data);
            await UpdateStepProgress(sessionToken, 12, recordId);
            return Success(new { recordId });
        }

        [RequireKycSessionOrAuth]
        [HttpPost("save-agreement/{sessionToken}")]
        public async Task<IActionResult> SaveAgreement([FromRoute] Guid sessionToken, [FromBody] SaveStepDto<AgreementDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(sessionToken);
            if (!isValid) return Failure(msg);
            var recordId = await _kycService.UpdateDetailAsync(sessionToken, 13, model.Data);
            await UpdateStepProgress(sessionToken, 13, recordId);
            return Success(new { recordId });
        }

        [HttpPost("upload-document")]
        public async Task<IActionResult> UploadDocument([FromForm] Guid sessionToken, [FromForm] byte documentType, [FromForm] IFormFile file)
        {
            try
            {
                var (isValid, msg, _) = await ValidateSessionAsync(sessionToken);
                if (!isValid) return Failure(msg);

                if (file == null || file.Length == 0) return Failure("No file uploaded");

                // Limit file size to 4MB
                const long maxFileSize = 4 * 1024 * 1024;
                if (file.Length > maxFileSize) return Failure("File size exceeds 4MB");

                byte[] content;
                using (var ms = new MemoryStream()) { await file.CopyToAsync(ms); content = ms.ToArray(); }

                string docTypeStr = documentType switch
                {
                    1 => "Photo", 2 => "CitizenshipFront", 3 => "CitizenshipBack", 4 => "Signature",
                    5 => "LeftThumb", 6 => "RightThumb", 10 => "LocationMap", _ => "Other_" + documentType
                };

                var doc = await _kycService.UploadDocumentAsync(sessionToken, docTypeStr, file.FileName, content, file.ContentType);
                await UpdateStepProgress(sessionToken, 14, doc.Id);

                return Success(new { filePath = doc.FilePath, id = doc.Id });
            }
            catch (Exception ex)
            {
                return Failure($"Upload error: {ex.Message}", 500);
            }
        }

        /// <summary>
        /// Replace an existing KYC document with a new file.
        /// Restricted to staff with Edit permissions for reviewer corrections.
        /// </summary>
        [HttpPost("replace-document")]
        [Microsoft.AspNetCore.Authorization.Authorize(Policy = Permissions.Kyc.Edit)]
        public async Task<IActionResult> ReplaceDocument([FromForm] int documentId, [FromForm] IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0) return Failure("No file uploaded");

                // Find the existing document
                var existingDoc = await _context.KycDocuments.FindAsync(documentId);
                if (existingDoc == null) return Failure("Document not found");

                // Limit file size to 4MB
                const long maxFileSize = 4 * 1024 * 1024;
                if (file.Length > maxFileSize)
                {
                    return Failure(
                        $"File size exceeds the maximum allowed size of 4MB. Your file is {file.Length / 1024.0 / 1024.0:F2}MB");
                }

                // Read new file bytes
                byte[] content;
                using (var ms = new MemoryStream())
                {
                    await file.CopyToAsync(ms);
                    content = ms.ToArray();
                }

                // Update the existing document
                existingDoc.Data = content;
                existingDoc.OriginalFileName = file.FileName;
                existingDoc.ContentType = file.ContentType;
                existingDoc.FileSize = (int)file.Length;
                existingDoc.UploadedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Success(new { message = "Document replaced successfully", id = existingDoc.Id });
            }
            catch (Exception ex)
            {
                return Failure($"Replace error: {ex.Message} | {ex.InnerException?.Message}", 500);
            }
        }

        /// <summary>
        /// Securely fetches a KYC document by ID.
        /// Implements strict ownership and staff-access checks to prevent data leaks.
        /// </summary>
        [HttpGet("document/{id}")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> GetDocument(int id)
        {
            var doc = await _context.KycDocuments
                .Include(d => d.KycDetail)
                .ThenInclude(k => k.Session)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (doc == null || doc.Data == null) return NotFound("Document data not found.");

            // Ownership Check: Only the owner or an Admin can view
            var isStaff = User.IsInRole("SuperAdmin") || User.Claims.Any(c => c.Type == "Permission");
            if (!isStaff && doc.KycDetail?.Session?.UserId != CurrentUserId)
            {
                return Forbid();
            }

            return File(doc.Data, doc.ContentType, doc.OriginalFileName);
        }

        // Helpers
        private async Task<(bool isValid, string message, KycFormSession? session)> ValidateSessionAsync(Guid sessionToken)
        {
            var session = await _context.KycFormSessions.FirstOrDefaultAsync(s => s.SessionToken == sessionToken);
            if (session == null) return (false, "KYC session not found.", null);

            if (session.IsExpired || (session.SessionExpiryDate.HasValue && session.SessionExpiryDate < DateTime.UtcNow))
                return (false, "Your session has expired.", null);

            // Ownership/Authentication Check
            if (session.UserId != null && CurrentUserId != null && session.UserId != CurrentUserId)
            {
                return (false, "Unauthorized access to this session.", null);
            }

            return (true, string.Empty, session);
        }

        private async Task UpdateStepProgress(Guid sessionToken, int stepNumber, int recordId)
        {
            var session = await _context.KycFormSessions.FirstOrDefaultAsync(s => s.SessionToken == sessionToken);
            if (session == null) return;

            var progress = await _context.KycStepCompletions
                .FirstOrDefaultAsync(sc => sc.SessionId == session.Id && sc.StepNumber == stepNumber);

            if (progress == null)
            {
                progress = new KycStepCompletion { SessionId = session.Id, StepNumber = stepNumber, CreatedDate = DateTime.UtcNow };
                await _context.KycStepCompletions.AddAsync(progress);
            }

            progress.IsSaved = true;
            progress.SavedDate = DateTime.UtcNow;
            progress.RecordId = recordId;
            progress.ModifiedDate = DateTime.UtcNow;
            progress.IsCompleted = true;
            progress.CompletedDate = DateTime.UtcNow;

            if (session.LastSavedStep < stepNumber) session.LastSavedStep = stepNumber;
            session.CurrentStep = Math.Max(session.CurrentStep, stepNumber + 1);
            session.LastActivityDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
    }
}
