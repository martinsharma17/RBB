using AUTHApi.Data;
using AUTHApi.DTOs;
using AUTHApi.Entities;
using AUTHApi.Services;
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

        [HttpGet("all-details/{sessionId}")]
        public async Task<IActionResult> GetAllDetails(int sessionId)
        {
            var (isValid, msg, session) = await ValidateSessionAsync(sessionId);
            if (!isValid) return Failure(msg);

            // Fetch the Single consolidated record
            var detail = await _context.KycDetails
                .Include(k => k.Documents)
                .FirstOrDefaultAsync(k => k.SessionId == sessionId);

            if (detail == null)
            {
                // Return empty structure if not created yet
                return Success(new KycFullDetailsDto
                    { SessionId = sessionId, Email = session!.Email, CurrentStep = session.CurrentStep });
            }

            // Map Entity -> DTO
            var response = new KycFullDetailsDto
            {
                SessionId = sessionId,
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
                    MaritalStatus = detail.MaritalStatus
                },
                CurrentAddress = new AddressDto
                {
                    Province = detail.CurrentState,
                    District = detail.CurrentDistrict,
                    MunicipalityName = detail.CurrentMunicipality,
                    WardNo = int.TryParse(detail.CurrentWardNo, out var currentWard) ? currentWard : null,
                    Tole = detail.CurrentStreet,
                    MobileNo = detail.MobileNumber ?? string.Empty
                },
                PermanentAddress = new AddressDto
                {
                    Province = detail.PermanentState,
                    District = detail.PermanentDistrict,
                    MunicipalityName = detail.PermanentMunicipality,
                    WardNo = int.TryParse(detail.PermanentWardNo, out var permWard) ? permWard : null,
                    Tole = detail.PermanentStreet
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
                    MotherInLawName = detail.MotherInLawName
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
                    PermanentAccountNo = detail.GuardianPanNumber
                },
                AmlCompliance = new AmlComplianceDto
                {
                    IsPoliticallyExposedPerson = detail.IsPep,
                    PepRelationName = detail.PepRelation,
                    HasBeneficialOwner = detail.HasBeneficialOwner,
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
        /// <param name="model">DTO containing personal info and session id.</param>
        /// <returns>Success envelope with the KycDetail record id.</returns>
        [HttpPost("save-personal-info")]
        public async Task<IActionResult> SavePersonalInfo([FromBody] SaveStepDto<PersonalInfoDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(model.SessionId);
            if (!isValid) return Failure(msg);

            // Using service to handle entity mapping and persistence
            var recordId = await _kycService.UpdateDetailAsync(model.SessionId, 1, model.Data);
            await UpdateStepProgress(model.SessionId, 1, recordId);
            return Success(new { recordId });
        }

        /// <summary>
        /// Save current address for a KYC session.
        /// </summary>
        [HttpPost("save-current-address")]
        public async Task<IActionResult> SaveCurrentAddress([FromBody] SaveStepDto<AddressDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(model.SessionId);
            if (!isValid) return Failure(msg);

            var recordId = await _kycService.UpdateDetailAsync(model.SessionId, 2, model.Data);
            await UpdateStepProgress(model.SessionId, 2, recordId);
            return Success(new { recordId });
        }

        /// <summary>
        /// Save permanent address for a KYC session.
        /// </summary>
        [HttpPost("save-permanent-address")]
        public async Task<IActionResult> SavePermanentAddress([FromBody] SaveStepDto<AddressDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(model.SessionId);
            if (!isValid) return Failure(msg);

            var recordId = await _kycService.UpdateDetailAsync(model.SessionId, 3, model.Data);
            await UpdateStepProgress(model.SessionId, 3, recordId);
            return Success(new { recordId });
        }

        /// <summary>
        /// Save family details for a KYC session.
        /// </summary>
        [HttpPost("save-family")]
        public async Task<IActionResult> SaveFamily([FromBody] SaveStepDto<FamilyDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(model.SessionId);
            if (!isValid) return Failure(msg);

            var recordId = await _kycService.UpdateDetailAsync(model.SessionId, 4, model.Data);
            await UpdateStepProgress(model.SessionId, 4, recordId);
            return Success(new { recordId });
        }

        /// <summary>
        /// Save bank account details for a KYC session.
        /// </summary>
        [HttpPost("save-bank-account")]
        public async Task<IActionResult> SaveBankAccount([FromBody] SaveStepDto<BankDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(model.SessionId);
            if (!isValid) return Failure(msg);

            var recordId = await _kycService.UpdateDetailAsync(model.SessionId, 5, model.Data);
            await UpdateStepProgress(model.SessionId, 5, recordId);
            return Success(new { recordId });
        }

        /// <summary>
        /// Save occupation details for a KYC session.
        /// </summary>
        [HttpPost("save-occupation")]
        public async Task<IActionResult> SaveOccupation([FromBody] SaveStepDto<OccupationDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(model.SessionId);
            if (!isValid) return Failure(msg);

            var recordId = await _kycService.UpdateDetailAsync(model.SessionId, 6, model.Data);
            await UpdateStepProgress(model.SessionId, 6, recordId);
            return Success(new { recordId });
        }

        /// <summary>
        /// Save financial details for a KYC session.
        /// </summary>
        [HttpPost("save-financial-details")]
        public async Task<IActionResult> SaveFinancialDetails([FromBody] SaveStepDto<FinancialDetailsDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(model.SessionId);
            if (!isValid) return Failure(msg);

            var recordId = await _kycService.UpdateDetailAsync(model.SessionId, 7, model.Data);
            await UpdateStepProgress(model.SessionId, 7, recordId);
            return Success(new { recordId });
        }

        /// <summary>
        /// Save transaction info for a KYC session.
        /// </summary>
        [HttpPost("save-transaction-info")]
        public async Task<IActionResult> SaveTransactionInfo([FromBody] SaveStepDto<TransactionInfoDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(model.SessionId);
            if (!isValid) return Failure(msg);

            var recordId = await _kycService.UpdateDetailAsync(model.SessionId, 8, model.Data);
            await UpdateStepProgress(model.SessionId, 8, recordId);
            return Success(new { recordId });
        }

        /// <summary>
        /// Save guardian details for a KYC session.
        /// </summary>
        [HttpPost("save-guardian")]
        public async Task<IActionResult> SaveGuardian([FromBody] SaveStepDto<GuardianDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(model.SessionId);
            if (!isValid) return Failure(msg);

            var recordId = await _kycService.UpdateDetailAsync(model.SessionId, 9, model.Data);
            await UpdateStepProgress(model.SessionId, 9, recordId);
            return Success(new { recordId });
        }

        /// <summary>
        /// Save AML compliance info for a KYC session.
        /// </summary>
        [HttpPost("save-aml-compliance")]
        public async Task<IActionResult> SaveAmlCompliance([FromBody] SaveStepDto<AmlComplianceDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(model.SessionId);
            if (!isValid) return Failure(msg);

            var recordId = await _kycService.UpdateDetailAsync(model.SessionId, 10, model.Data);
            await UpdateStepProgress(model.SessionId, 10, recordId);
            return Success(new { recordId });
        }

        /// <summary>
        /// Save location map details for a KYC session.
        /// </summary>
        [HttpPost("save-location-map")]
        public async Task<IActionResult> SaveLocationMap([FromBody] SaveStepDto<LocationMapDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(model.SessionId);
            if (!isValid) return Failure(msg);

            var recordId = await _kycService.UpdateDetailAsync(model.SessionId, 11, model.Data);
            await UpdateStepProgress(model.SessionId, 11, recordId);
            return Success(new { recordId });
        }

        /// <summary>
        /// Save legal declarations for a KYC session.
        /// </summary>
        [HttpPost("save-declarations")]
        public async Task<IActionResult> SaveDeclarations([FromBody] SaveStepDto<DeclarationsDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(model.SessionId);
            if (!isValid) return Failure(msg);

            var recordId = await _kycService.UpdateDetailAsync(model.SessionId, 12, model.Data);
            await UpdateStepProgress(model.SessionId, 12, recordId);
            return Success(new { recordId });
        }

        /// <summary>
        /// Save general agreement for a KYC session.
        /// </summary>
        [HttpPost("save-agreement")]
        public async Task<IActionResult> SaveAgreement([FromBody] SaveStepDto<AgreementDto> model)
        {
            var (isValid, msg, _) = await ValidateSessionAsync(model.SessionId);
            if (!isValid) return Failure(msg);

            var recordId = await _kycService.UpdateDetailAsync(model.SessionId, 13, model.Data);
            await UpdateStepProgress(model.SessionId, 13, recordId);
            return Success(new { recordId });
        }

        /// <summary>
        /// Upload a KYC related document (photo, citizenship front/back, etc.).
        /// </summary>
        [HttpPost("upload-document")]
        public async Task<IActionResult> UploadDocument([FromForm] int sessionId, [FromForm] byte documentType,
            [FromForm] IFormFile file)
        {
            try
            {
                var (isValid, msg, _) = await ValidateSessionAsync(sessionId);
                if (!isValid) return Failure(msg);

                if (file == null || file.Length == 0) return Failure("No file uploaded");

                // Limit file size to 4MB
                const long maxFileSize = 4 * 1024 * 1024; // 4MB in bytes
                if (file.Length > maxFileSize)
                {
                    return Failure(
                        $"File size exceeds the maximum allowed size of 4MB. Your file is {file.Length / 1024.0 / 1024.0:F2}MB");
                }

                // Read file bytes
                byte[] content;
                using (var ms = new MemoryStream())
                {
                    await file.CopyToAsync(ms);
                    content = ms.ToArray();
                }

                // Map byte type to string for legacy frontend compatibility (1=Photo, 2=CitFront, 3=CitBack)
                string docTypeStr = documentType switch
                {
                    1 => "Photo",
                    2 => "CitizenshipFront",
                    3 => "CitizenshipBack",
                    4 => "Signature",
                    5 => "LeftThumb",
                    6 => "RightThumb",
                    10 => "LocationMap",
                    _ => "Other_" + documentType
                };

                var doc = await _kycService.UploadDocumentAsync(sessionId, docTypeStr, file.FileName, content,
                    file.ContentType);

                // Assuming step 11 is documents
                try
                {
                    await UpdateStepProgress(sessionId, 14, doc.Id);
                }
                catch
                {
                    // Ignore progress update errors for documents to prevent blocking the upload itself
                }

                return Success(new { filePath = doc.FilePath, id = doc.Id });
            }
            catch (Exception ex)
            {
                return Failure($"Upload error: {ex.Message} | {ex.InnerException?.Message}", 500);
            }
        }

        /// <summary>
        /// Replace an existing KYC document with a new file.
        /// </summary>
        [HttpPost("replace-document")]
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
        /// Retrieve a document's binary data from the database.
        /// </summary>
        [HttpGet("document/{id}")]
        public async Task<IActionResult> GetDocument(int id)
        {
            var doc = await _context.KycDocuments.FindAsync(id);
            if (doc == null || doc.Data == null)
            {
                return NotFound("Document or image data not found.");
            }

            return File(doc.Data, doc.ContentType, doc.OriginalFileName);
        }

        // Helpers
        private async Task<(bool isValid, string message, KycFormSession? session)> ValidateSessionAsync(int sessionId)
        {
            var session = await _context.KycFormSessions.FindAsync(sessionId);
            if (session == null) return (false, "KYC session not found.", null);

            if (session.IsExpired ||
                (session.SessionExpiryDate.HasValue && session.SessionExpiryDate < DateTime.UtcNow))
                return (false, "Your session has expired.", null);

            /* COMMENTED FOR DEV BYPASS
            if (!session.EmailVerified)
            {
                // SELF-HEALING: Check if email is verified in another active session
                var alreadyVerified = await _context.KycFormSessions
                    .AnyAsync(s => s.Email == session.Email && s.EmailVerified && !s.IsExpired);

                if (alreadyVerified)
                {
                    session.EmailVerified = true;
                    session.EmailVerifiedDate = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
                else
                {
                    return (false, "Please verify your email address before proceeding with the KYC form.", null);
                }
            }
            */

            return (true, string.Empty, session);
        }

        private async Task UpdateStepProgress(int sessionId, int stepNumber, int recordId)
        {
            var progress = await _context.KycStepCompletions
                .FirstOrDefaultAsync(sc => sc.SessionId == sessionId && sc.StepNumber == stepNumber);

            if (progress == null)
            {
                progress = new KycStepCompletion
                {
                    SessionId = sessionId,
                    StepNumber = stepNumber,
                    CreatedDate = DateTime.UtcNow
                };
                await _context.KycStepCompletions.AddAsync(progress);
            }

            progress.IsSaved = true;
            progress.SavedDate = DateTime.UtcNow;
            progress.RecordId = recordId;
            progress.ModifiedDate = DateTime.UtcNow;
            progress.IsCompleted = true;
            progress.CompletedDate = DateTime.UtcNow;

            var session = await _context.KycFormSessions.FindAsync(sessionId);
            if (session != null)
            {
                if (session.LastSavedStep < stepNumber) session.LastSavedStep = stepNumber;
                session.CurrentStep = Math.Max(session.CurrentStep, stepNumber + 1);
                session.LastActivityDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }
    }
}
