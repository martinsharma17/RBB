using AUTHApi.Data;
using AUTHApi.DTOs;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
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

        [HttpPost("save-personal-info")]
        public async Task<IActionResult> SavePersonalInfo([FromBody] SaveStepDto<PersonalInfoDto> model)
        {
            var session = await _context.KycFormSessions.FindAsync(model.SessionId);
            if (session == null) return NotFound("Session not found");

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
            var entity = await _context.KycCurrentAddresses.FirstOrDefaultAsync(a => a.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycCurrentAddress { SessionId = model.SessionId };
                var session = await _context.KycFormSessions.FindAsync(model.SessionId);
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
            var entity = await _context.KycPermanentAddresses.FirstOrDefaultAsync(a => a.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycPermanentAddress { SessionId = model.SessionId };
                var session = await _context.KycFormSessions.FindAsync(model.SessionId);
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
            var entity = await _context.KycFamilies.FirstOrDefaultAsync(f => f.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycFamily { SessionId = model.SessionId };
                var session = await _context.KycFormSessions.FindAsync(model.SessionId);
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
            var entity = await _context.KycBanks.FirstOrDefaultAsync(b => b.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycBank { SessionId = model.SessionId };
                var session = await _context.KycFormSessions.FindAsync(model.SessionId);
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
            var entity = await _context.KycOccupations.FirstOrDefaultAsync(o => o.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycOccupation { SessionId = model.SessionId };
                var session = await _context.KycFormSessions.FindAsync(model.SessionId);
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
            var entity = await _context.KycFinancialDetails.FirstOrDefaultAsync(f => f.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycFinancialDetails { SessionId = model.SessionId };
                var session = await _context.KycFormSessions.FindAsync(model.SessionId);
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
            var entity = await _context.KycTransactionInfos.FirstOrDefaultAsync(t => t.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycTransactionInfo { SessionId = model.SessionId };
                var session = await _context.KycFormSessions.FindAsync(model.SessionId);
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
            var entity = await _context.KycGuardians.FirstOrDefaultAsync(g => g.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycGuardian { SessionId = model.SessionId };
                var session = await _context.KycFormSessions.FindAsync(model.SessionId);
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
            var entity = await _context.KycAmlCompliances.FirstOrDefaultAsync(a => a.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycAmlCompliance { SessionId = model.SessionId };
                var session = await _context.KycFormSessions.FindAsync(model.SessionId);
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
            if (file == null || file.Length == 0) return BadRequest("No file uploaded");

            var session = await _context.KycFormSessions.FindAsync(sessionId);
            if (session == null) return NotFound("Session not found");

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
            var entity = await _context.KycLocationMaps.FirstOrDefaultAsync(l => l.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycLocationMap { SessionId = model.SessionId };
                var session = await _context.KycFormSessions.FindAsync(model.SessionId);
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
            var entity = await _context.KycDeclarations.FirstOrDefaultAsync(d => d.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycDeclarations { SessionId = model.SessionId };
                var session = await _context.KycFormSessions.FindAsync(model.SessionId);
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
            var entity = await _context.KycAgreements.FirstOrDefaultAsync(a => a.SessionId == model.SessionId);
            if (entity == null)
            {
                entity = new KycAgreement { SessionId = model.SessionId };
                var session = await _context.KycFormSessions.FindAsync(model.SessionId);
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
    }
}
