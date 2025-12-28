using AUTHApi.Data;
using AUTHApi.DTOs;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace AUTHApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KycDataController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public KycDataController(ApplicationDbContext context)
        {
            _context = context;
        }

        #region Fetch Endpoints

        [HttpGet("all-details/{sessionId}")]
        public async Task<IActionResult> GetAllDetails(int sessionId)
        {
            var session = await _context.KycFormSessions.FindAsync(sessionId);
            if (session == null) return NotFound("Session not found");

            var personalInfo = await _context.KycPersonalInfos.FirstOrDefaultAsync(p => p.SessionId == sessionId);
            var currentAddress = await _context.KycCurrentAddresses.FirstOrDefaultAsync(a => a.SessionId == sessionId);
            var permanentAddress =
                await _context.KycPermanentAddresses.FirstOrDefaultAsync(a => a.SessionId == sessionId);
            var family = await _context.KycFamilies.FirstOrDefaultAsync(f => f.SessionId == sessionId);
            var bank = await _context.KycBanks.FirstOrDefaultAsync(b => b.SessionId == sessionId);
            var occupation = await _context.KycOccupations.FirstOrDefaultAsync(o => o.SessionId == sessionId);
            var financial = await _context.KycFinancialDetails.FirstOrDefaultAsync(f => f.SessionId == sessionId);
            var transaction = await _context.KycTransactionInfos.FirstOrDefaultAsync(t => t.SessionId == sessionId);
            var guardian = await _context.KycGuardians.FirstOrDefaultAsync(g => g.SessionId == sessionId);
            var aml = await _context.KycAmlCompliances.FirstOrDefaultAsync(a => a.SessionId == sessionId);
            var attachments = await _context.KycAttachments.Where(a => a.SessionId == sessionId).ToListAsync();
            var location = await _context.KycLocationMaps.FirstOrDefaultAsync(l => l.SessionId == sessionId);
            var declarations = await _context.KycDeclarations.FirstOrDefaultAsync(d => d.SessionId == sessionId);
            var agreement = await _context.KycAgreements.FirstOrDefaultAsync(a => a.SessionId == sessionId);

            var response = new KycFullDetailsDto
            {
                SessionId = sessionId,
                Email = session.Email,
                PersonalInfo = personalInfo == null
                    ? null
                    : new PersonalInfoDto
                    {
                        FullName = personalInfo.FullName,
                        DateOfBirthBs = personalInfo.DateOfBirthBs,
                        DateOfBirthAd = personalInfo.DateOfBirthAd,
                        Gender = personalInfo.Gender,
                        IsNepali = personalInfo.IsNepali,
                        OtherNationality = personalInfo.OtherNationality,
                        CitizenshipNo = personalInfo.CitizenshipNo,
                        CitizenshipIssueDistrict = personalInfo.CitizenshipIssueDistrict,
                        CitizenshipIssueDate = personalInfo.CitizenshipIssueDate,
                        ClientAccountNo = personalInfo.ClientAccountNo,
                        ReferenceNo = personalInfo.ReferenceNo
                    },
                CurrentAddress = MapAddress(currentAddress),
                PermanentAddress = MapAddress(permanentAddress),
                Family = family == null
                    ? null
                    : new FamilyDto
                    {
                        GrandFatherName = family.GrandFatherName,
                        FatherName = family.FatherName,
                        MotherName = family.MotherName,
                        SpouseName = family.SpouseName,
                        SonName = family.SonName,
                        DaughterName = family.DaughterName
                    },
                Bank = bank == null
                    ? null
                    : new BankDto
                    {
                        AccountType = bank.AccountType,
                        BankAccountNo = bank.BankAccountNo,
                        BankName = bank.BankName,
                        BankAddress = bank.BankAddress
                    },
                Occupation = occupation == null
                    ? null
                    : new OccupationDto
                    {
                        OccupationType = occupation.OccupationType,
                        OtherOccupation = occupation.OtherOccupation,
                        ServiceSector = occupation.ServiceSector,
                        BusinessType = occupation.BusinessType,
                        OrganizationName = occupation.OrganizationName,
                        OrganizationAddress = occupation.OrganizationAddress,
                        Designation = occupation.Designation,
                        EmployeeIdNo = occupation.EmployeeIdNo
                    },
                FinancialDetails = financial == null
                    ? null
                    : new FinancialDetailsDto
                    {
                        AnnualIncomeRange = financial.AnnualIncomeRange,
                        EstimatedAnnualIncome = financial.EstimatedAnnualIncome
                    },
                TransactionInfo = transaction == null
                    ? null
                    : new TransactionInfoDto
                    {
                        SourceOfNetWorth = transaction.SourceOfNetWorth,
                        MajorSourceOfIncome = transaction.MajorSourceOfIncome,
                        HasOtherBrokerAccount = transaction.HasOtherBrokerAccount,
                        OtherBrokerNames = transaction.OtherBrokerNames,
                        IsCibBlacklisted = transaction.IsCibBlacklisted,
                        CibBlacklistDetails = transaction.CibBlacklistDetails
                    },
                Guardian = guardian == null
                    ? null
                    : new GuardianDto
                    {
                        FullName = guardian.GuardianFullName,
                        Relationship = guardian.RelationshipWithApplicant,
                        Address = guardian.CorrespondenceAddress,
                        ContactNo = guardian.MobileNo,
                        EmailId = guardian.EmailId,
                        PermanentAccountNo = guardian.PermanentAccountNo
                    },
                AmlCompliance = aml == null
                    ? null
                    : new AmlComplianceDto
                    {
                        IsPoliticallyExposedPerson = aml.IsPoliticallyExposedPerson,
                        IsRelatedToPep = aml.IsRelatedToPep,
                        PepRelationName = aml.PepRelationName,
                        PepRelationship = aml.PepRelationship,
                        HasBeneficialOwner = aml.HasBeneficialOwner,
                        HasCriminalRecord = aml.HasCriminalRecord,
                        CriminalRecordDetails = aml.CriminalRecordDetails
                    },
                Attachments = attachments.Select(a => new KycAttachmentDto
                {
                    Id = a.Id,
                    DocumentType = a.DocumentType,
                    DocumentName = a.DocumentName,
                    FilePath = a.FilePath ?? "",
                    FileSize = a.FileSize ?? 0,
                    MimeType = a.MimeType
                }).ToList(),
                LocationMap = location == null
                    ? null
                    : new LocationMapDto
                    {
                        Landmark = location.Landmark,
                        DistanceFromMainRoad = location.DistanceFromMainRoad,
                        Latitude = location.Latitude,
                        Longitude = location.Longitude,
                        CanvasDataJson = location.CanvasDataJson
                    },
                Declarations = declarations == null
                    ? null
                    : new DeclarationsDto
                    {
                        AgreeToTerms = declarations.AgreeToTerms,
                        NoOtherFinancialLiability = declarations.NoOtherFinancialLiability,
                        AllInformationTrue = declarations.AllInformationTrue
                    },
                Agreement = agreement == null
                    ? null
                    : new AgreementDto
                    {
                        AgreementDate = agreement.AgreementDate,
                        TradingLimit = agreement.TradingLimit,
                        MarginTradingFacility = agreement.MarginTradingFacility
                    }
            };

            return Ok(response);
        }

        private AddressDto? MapAddress(dynamic? address)
        {
            if (address == null) return null;
            return new AddressDto
            {
                Country = address.Country,
                Province = address.Province,
                District = address.District,
                MunicipalityType = address.MunicipalityType,
                MunicipalityName = address.MunicipalityName,
                WardNo = address.WardNo,
                Tole = address.Tole,
                TelephoneNo = address.TelephoneNo,
                MobileNo = address.MobileNo,
                EmailId = address.EmailId
            };
        }

        #endregion

        #region Save Endpoints

        [HttpPost("save-personal-info")]
        public async Task<IActionResult> SavePersonalInfo([FromBody] SaveStepDto<PersonalInfoDto> model)
        {
            var validation = await ValidateSessionAsync(model.SessionId);
            if (!validation.isValid) return BadRequest(validation.message);

            var session = validation.session!;

            var entity = await _context.KycPersonalInfos.FirstOrDefaultAsync(p => p.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycPersonalInfo { SessionId = model.SessionId };
                await _context.KycPersonalInfos.AddAsync(entity);
            }

            entity.FullName = model.Data.FullName;
            entity.DateOfBirthBs = model.Data.DateOfBirthBs;
            entity.DateOfBirthAd = model.Data.DateOfBirthAd;
            entity.Gender = model.Data.Gender;
            entity.IsNepali = model.Data.IsNepali;
            entity.OtherNationality = model.Data.OtherNationality;
            entity.CitizenshipNo = model.Data.CitizenshipNo;
            entity.CitizenshipIssueDistrict = model.Data.CitizenshipIssueDistrict;
            entity.CitizenshipIssueDate = model.Data.CitizenshipIssueDate;
            entity.ClientAccountNo = model.Data.ClientAccountNo;
            entity.ReferenceNo = model.Data.ReferenceNo;
            entity.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            if (session.KycPersonalInfoId == null)
            {
                session.KycPersonalInfoId = entity.Id;
                await _context.SaveChangesAsync();
            }

            await UpdateStepProgress(model.SessionId, 1, entity.Id);
            return Ok(new { success = true, recordId = entity.Id });
        }

        [HttpPost("save-current-address")]
        public async Task<IActionResult> SaveCurrentAddress([FromBody] SaveStepDto<AddressDto> model)
        {
            var validation = await ValidateSessionAsync(model.SessionId);
            if (!validation.isValid) return BadRequest(validation.message);

            var entity = await _context.KycCurrentAddresses.FirstOrDefaultAsync(a => a.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycCurrentAddress { SessionId = model.SessionId };
                var session = validation.session!;
                entity.KycPersonalInfoId = session?.KycPersonalInfoId;
                await _context.KycCurrentAddresses.AddAsync(entity);
            }

            entity.Country = model.Data.Country;
            entity.Province = model.Data.Province;
            entity.District = model.Data.District;
            entity.MunicipalityType = model.Data.MunicipalityType;
            entity.MunicipalityName = model.Data.MunicipalityName;
            entity.WardNo = model.Data.WardNo;
            entity.Tole = model.Data.Tole;
            entity.TelephoneNo = model.Data.TelephoneNo;
            entity.MobileNo = model.Data.MobileNo;
            entity.EmailId = model.Data.EmailId;
            entity.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            await UpdateStepProgress(model.SessionId, 2, entity.Id);
            return Ok(new { success = true, recordId = entity.Id });
        }

        [HttpPost("save-permanent-address")]
        public async Task<IActionResult> SavePermanentAddress([FromBody] SaveStepDto<AddressDto> model)
        {
            var validation = await ValidateSessionAsync(model.SessionId);
            if (!validation.isValid) return BadRequest(validation.message);

            var entity = await _context.KycPermanentAddresses.FirstOrDefaultAsync(a => a.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycPermanentAddress { SessionId = model.SessionId };
                var session = validation.session!;
                entity.KycPersonalInfoId = session?.KycPersonalInfoId;
                await _context.KycPermanentAddresses.AddAsync(entity);
            }

            entity.Country = model.Data.Country;
            entity.Province = model.Data.Province;
            entity.District = model.Data.District;
            entity.MunicipalityType = model.Data.MunicipalityType;
            entity.MunicipalityName = model.Data.MunicipalityName;
            entity.WardNo = model.Data.WardNo;
            entity.Tole = model.Data.Tole;
            entity.TelephoneNo = model.Data.TelephoneNo;
            entity.MobileNo = model.Data.MobileNo;
            entity.EmailId = model.Data.EmailId;
            entity.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            await UpdateStepProgress(model.SessionId, 3, entity.Id);
            return Ok(new { success = true, recordId = entity.Id });
        }

        [HttpPost("save-family")]
        public async Task<IActionResult> SaveFamily([FromBody] SaveStepDto<FamilyDto> model)
        {
            var validation = await ValidateSessionAsync(model.SessionId);
            if (!validation.isValid) return BadRequest(validation.message);

            var entity = await _context.KycFamilies.FirstOrDefaultAsync(f => f.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycFamily { SessionId = model.SessionId };
                var session = validation.session!;
                entity.KycPersonalInfoId = session?.KycPersonalInfoId;
                await _context.KycFamilies.AddAsync(entity);
            }

            entity.GrandFatherName = model.Data.GrandFatherName;
            entity.FatherName = model.Data.FatherName;
            entity.MotherName = model.Data.MotherName;
            entity.SpouseName = model.Data.SpouseName;
            entity.SonName = model.Data.SonName;
            entity.DaughterName = model.Data.DaughterName;
            entity.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            await UpdateStepProgress(model.SessionId, 4, entity.Id);
            return Ok(new { success = true, recordId = entity.Id });
        }

        [HttpPost("save-bank-account")]
        public async Task<IActionResult> SaveBank([FromBody] SaveStepDto<BankDto> model)
        {
            var validation = await ValidateSessionAsync(model.SessionId);
            if (!validation.isValid) return BadRequest(validation.message);

            var entity = await _context.KycBanks.FirstOrDefaultAsync(b => b.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycBank { SessionId = model.SessionId };
                var session = validation.session!;
                entity.KycPersonalInfoId = session?.KycPersonalInfoId;
                await _context.KycBanks.AddAsync(entity);
            }

            entity.AccountType = model.Data.AccountType;
            entity.BankAccountNo = model.Data.BankAccountNo;
            entity.BankName = model.Data.BankName;
            entity.BankAddress = model.Data.BankAddress;
            entity.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            await UpdateStepProgress(model.SessionId, 5, entity.Id);
            return Ok(new { success = true, recordId = entity.Id });
        }

        [HttpPost("save-occupation")]
        public async Task<IActionResult> SaveOccupation([FromBody] SaveStepDto<OccupationDto> model)
        {
            var validation = await ValidateSessionAsync(model.SessionId);
            if (!validation.isValid) return BadRequest(validation.message);

            var entity = await _context.KycOccupations.FirstOrDefaultAsync(o => o.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycOccupation { SessionId = model.SessionId };
                var session = validation.session!;
                entity.KycPersonalInfoId = session?.KycPersonalInfoId;
                await _context.KycOccupations.AddAsync(entity);
            }

            entity.OccupationType = model.Data.OccupationType;
            entity.OtherOccupation = model.Data.OtherOccupation;
            entity.ServiceSector = model.Data.ServiceSector;
            entity.BusinessType = model.Data.BusinessType;
            entity.OrganizationName = model.Data.OrganizationName;
            entity.OrganizationAddress = model.Data.OrganizationAddress;
            entity.Designation = model.Data.Designation;
            entity.EmployeeIdNo = model.Data.EmployeeIdNo;
            entity.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            await UpdateStepProgress(model.SessionId, 6, entity.Id);
            return Ok(new { success = true, recordId = entity.Id });
        }

        [HttpPost("save-financial-details")]
        public async Task<IActionResult> SaveFinancial([FromBody] SaveStepDto<FinancialDetailsDto> model)
        {
            var validation = await ValidateSessionAsync(model.SessionId);
            if (!validation.isValid) return BadRequest(validation.message);

            var entity = await _context.KycFinancialDetails.FirstOrDefaultAsync(f => f.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycFinancialDetails { SessionId = model.SessionId };
                var session = validation.session!;
                entity.KycPersonalInfoId = session?.KycPersonalInfoId;
                await _context.KycFinancialDetails.AddAsync(entity);
            }

            entity.AnnualIncomeRange = model.Data.AnnualIncomeRange;
            entity.EstimatedAnnualIncome = model.Data.EstimatedAnnualIncome;
            entity.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            await UpdateStepProgress(model.SessionId, 7, entity.Id);
            return Ok(new { success = true, recordId = entity.Id });
        }

        [HttpPost("save-transaction-info")]
        public async Task<IActionResult> SaveTransaction([FromBody] SaveStepDto<TransactionInfoDto> model)
        {
            var validation = await ValidateSessionAsync(model.SessionId);
            if (!validation.isValid) return BadRequest(validation.message);

            var entity = await _context.KycTransactionInfos.FirstOrDefaultAsync(t => t.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycTransactionInfo { SessionId = model.SessionId };
                var session = validation.session!;
                entity.KycPersonalInfoId = session?.KycPersonalInfoId;
                await _context.KycTransactionInfos.AddAsync(entity);
            }

            entity.SourceOfNetWorth = model.Data.SourceOfNetWorth;
            entity.MajorSourceOfIncome = model.Data.MajorSourceOfIncome;
            entity.HasOtherBrokerAccount = model.Data.HasOtherBrokerAccount;
            entity.OtherBrokerNames = model.Data.OtherBrokerNames;
            entity.IsCibBlacklisted = model.Data.IsCibBlacklisted;
            entity.CibBlacklistDetails = model.Data.CibBlacklistDetails;
            entity.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            await UpdateStepProgress(model.SessionId, 8, entity.Id);
            return Ok(new { success = true, recordId = entity.Id });
        }

        [HttpPost("save-guardian")]
        public async Task<IActionResult> SaveGuardian([FromBody] SaveStepDto<GuardianDto> model)
        {
            var validation = await ValidateSessionAsync(model.SessionId);
            if (!validation.isValid) return BadRequest(validation.message);

            var entity = await _context.KycGuardians.FirstOrDefaultAsync(g => g.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycGuardian { SessionId = model.SessionId };
                var session = validation.session!;
                entity.KycPersonalInfoId = session?.KycPersonalInfoId;
                await _context.KycGuardians.AddAsync(entity);
            }

            entity.GuardianFullName = model.Data.FullName;
            entity.RelationshipWithApplicant = model.Data.Relationship;
            entity.CorrespondenceAddress = model.Data.Address;
            entity.MobileNo = model.Data.ContactNo;
            entity.EmailId = model.Data.EmailId;
            entity.PermanentAccountNo = model.Data.PermanentAccountNo;
            entity.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            await UpdateStepProgress(model.SessionId, 9, entity.Id);
            return Ok(new { success = true, recordId = entity.Id });
        }

        [HttpPost("save-aml-compliance")]
        public async Task<IActionResult> SaveAml([FromBody] SaveStepDto<AmlComplianceDto> model)
        {
            var validation = await ValidateSessionAsync(model.SessionId);
            if (!validation.isValid) return BadRequest(validation.message);

            var entity = await _context.KycAmlCompliances.FirstOrDefaultAsync(a => a.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycAmlCompliance { SessionId = model.SessionId };
                var session = validation.session!;
                entity.KycPersonalInfoId = session?.KycPersonalInfoId;
                await _context.KycAmlCompliances.AddAsync(entity);
            }

            entity.IsPoliticallyExposedPerson = model.Data.IsPoliticallyExposedPerson;
            entity.IsRelatedToPep = model.Data.IsRelatedToPep;
            entity.PepRelationName = model.Data.PepRelationName;
            entity.PepRelationship = model.Data.PepRelationship;
            entity.HasBeneficialOwner = model.Data.HasBeneficialOwner;
            entity.HasCriminalRecord = model.Data.HasCriminalRecord;
            entity.CriminalRecordDetails = model.Data.CriminalRecordDetails;
            entity.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            await UpdateStepProgress(model.SessionId, 10, entity.Id);
            return Ok(new { success = true, recordId = entity.Id });
        }

        [HttpPost("upload-document")]
        public async Task<IActionResult> UploadDocument([FromForm] int sessionId, [FromForm] byte documentType,
            [FromForm] Microsoft.AspNetCore.Http.IFormFile file)
        {
            var validation = await ValidateSessionAsync(sessionId);
            if (!validation.isValid) return BadRequest(validation.message);

            if (file == null || file.Length == 0) return BadRequest("No file uploaded");

            var session = validation.session!;

            var uploads = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "kyc",
                sessionId.ToString());
            if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);

            var fileName = $"{documentType}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploads, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create)) await file.CopyToAsync(stream);

            var attachment = new KycAttachment
            {
                SessionId = sessionId,
                KycPersonalInfoId = session.KycPersonalInfoId,
                DocumentType = documentType,
                DocumentName = file.FileName,
                FileName = fileName,
                FilePath = $"/uploads/kyc/{sessionId}/{fileName}",
                FileSize = file.Length,
                MimeType = file.ContentType,
                UploadedDate = DateTime.Now,
                IsDraft = true
            };

            await _context.KycAttachments.AddAsync(attachment);
            await _context.SaveChangesAsync();
            await UpdateStepProgress(sessionId, 11, attachment.Id);
            return Ok(new { success = true, filePath = attachment.FilePath, id = attachment.Id });
        }

        [HttpPost("save-location-map")]
        public async Task<IActionResult> SaveLocation([FromBody] SaveStepDto<LocationMapDto> model)
        {
            var validation = await ValidateSessionAsync(model.SessionId);
            if (!validation.isValid) return BadRequest(validation.message);

            var entity = await _context.KycLocationMaps.FirstOrDefaultAsync(l => l.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycLocationMap { SessionId = model.SessionId };
                var session = validation.session!;
                entity.KycPersonalInfoId = session?.KycPersonalInfoId;
                await _context.KycLocationMaps.AddAsync(entity);
            }

            entity.Landmark = model.Data.Landmark;
            entity.DistanceFromMainRoad = model.Data.DistanceFromMainRoad;
            entity.Latitude = model.Data.Latitude;
            entity.Longitude = model.Data.Longitude;
            entity.CanvasDataJson = model.Data.CanvasDataJson;
            entity.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            await UpdateStepProgress(model.SessionId, 12, entity.Id);
            return Ok(new { success = true, recordId = entity.Id });
        }

        [HttpPost("save-declarations")]
        public async Task<IActionResult> SaveDeclarations([FromBody] SaveStepDto<DeclarationsDto> model)
        {
            var validation = await ValidateSessionAsync(model.SessionId);
            if (!validation.isValid) return BadRequest(validation.message);

            var entity = await _context.KycDeclarations.FirstOrDefaultAsync(d => d.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycDeclarations { SessionId = model.SessionId };
                var session = validation.session!;
                entity.KycPersonalInfoId = session?.KycPersonalInfoId;
                await _context.KycDeclarations.AddAsync(entity);
            }

            entity.AgreeToTerms = model.Data.AgreeToTerms;
            entity.NoOtherFinancialLiability = model.Data.NoOtherFinancialLiability;
            entity.AllInformationTrue = model.Data.AllInformationTrue;
            entity.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            await UpdateStepProgress(model.SessionId, 13, entity.Id);
            return Ok(new { success = true, recordId = entity.Id });
        }

        [HttpPost("save-agreement")]
        public async Task<IActionResult> SaveAgreement([FromBody] SaveStepDto<AgreementDto> model)
        {
            var validation = await ValidateSessionAsync(model.SessionId);
            if (!validation.isValid) return BadRequest(validation.message);

            var entity = await _context.KycAgreements.FirstOrDefaultAsync(a => a.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycAgreement { SessionId = model.SessionId };
                var session = validation.session!;
                entity.KycPersonalInfoId = session?.KycPersonalInfoId;
                await _context.KycAgreements.AddAsync(entity);
            }

            entity.AgreementDate = model.Data.AgreementDate;
            entity.TradingLimit = model.Data.TradingLimit;
            entity.MarginTradingFacility = model.Data.MarginTradingFacility;
            entity.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            await UpdateStepProgress(model.SessionId, 14, entity.Id);
            return Ok(new { success = true, recordId = entity.Id });
        }

        #endregion

        #region Helpers

        /// <summary>
        /// Validates if the KYC session exists, is not expired, and has completed email verification.
        /// This acts as a gatekeeper to prevent data entry before authentication.
        /// </summary>
        private async Task<(bool isValid, string message, KycFormSession? session)> ValidateSessionAsync(int sessionId)
        {
            var session = await _context.KycFormSessions.FindAsync(sessionId);

            if (session == null)
                return (false, "KYC session not found.", null);

            if (session.IsExpired || (session.SessionExpiryDate.HasValue && session.SessionExpiryDate < DateTime.Now))
                return (false, "Your session has expired. Please restart the process.", null);

            if (!session.EmailVerified)
                return (false, "Email verification is mandatory before you can start filling the KYC form.", null);

            return (true, string.Empty, session);
        }

        private async Task UpdateStepProgress(int sessionId, int stepNumber, int recordId)
        {
            var progress = await _context.KycStepCompletions
                .FirstOrDefaultAsync(sc => sc.SessionId == sessionId && sc.StepNumber == stepNumber);
            if (progress != null)
            {
                progress.IsSaved = true;
                progress.SavedDate = DateTime.Now;
                progress.RecordId = recordId;
                progress.ModifiedDate = DateTime.Now;
            }

            var session = await _context.KycFormSessions.FindAsync(sessionId);
            if (session != null)
            {
                if (session.LastSavedStep < stepNumber) session.LastSavedStep = stepNumber;
                session.LastActivityDate = DateTime.Now;
            }

            await _context.SaveChangesAsync();
        }

        #endregion
    }
}
