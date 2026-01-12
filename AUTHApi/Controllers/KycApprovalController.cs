using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AUTHApi.Data;
using AUTHApi.Entities;
using AUTHApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using AUTHApi.Core.Security;
using AUTHApi.DTOs;

namespace AUTHApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KycApprovalController : BaseApiController
    {
        private readonly IKycWorkflowService _workflowService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public KycApprovalController(IKycWorkflowService workflowService, UserManager<ApplicationUser> userManager,
            ApplicationDbContext context)
        {
            _workflowService = workflowService;
            _userManager = userManager;
            _context = context;
        }

        /// <summary>
        /// Staff action to approve a KYC.
        /// </summary>
        [HttpPost("approve")]
        [Authorize]
        public async Task<IActionResult> ApproveKyc([FromBody] ApprovalModel model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var workflow = await _context.KycWorkflowMasters.FindAsync(model.WorkflowId);
            if (workflow == null) return Failure("Workflow not found.");

            // AUTHORIZATION: Check if user is in the correct role for this step OR is Admin
            var user = await _userManager.FindByIdAsync(userId);
            var userRoles = await _userManager.GetRolesAsync(user!);
            var isGlobalAdmin = userRoles.Any(r => r == "SuperAdmin" || r == "Admin");

            if (!isGlobalAdmin && workflow.CurrentRoleId != null)
            {
                var roleIds = await _context.Roles
                    .Where(r => userRoles.Contains(r.Name))
                    .Select(r => r.Id)
                    .ToListAsync();

                if (!roleIds.Contains(workflow.CurrentRoleId))
                {
                    return Failure("You are not authorized to action this KYC at its current level.", 403);
                }
            }

            var (success, message) = await _workflowService.ApproveAsync(model.WorkflowId, userId, model.Remarks);
            if (!success) return Failure(message);

            return Success(message);
        }

        /// <summary>
        /// Staff action to reject a KYC.
        /// </summary>
        [HttpPost("reject")]
        [Authorize]
        public async Task<IActionResult> RejectKyc([FromBody] ApprovalModel model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var workflow = await _context.KycWorkflowMasters.FindAsync(model.WorkflowId);
            if (workflow == null) return Failure("Workflow not found.");

            // AUTHORIZATION: Check if user is in the correct role for this step OR is Admin
            var user = await _userManager.FindByIdAsync(userId);
            var userRoles = await _userManager.GetRolesAsync(user!);
            var isGlobalAdmin = userRoles.Any(r => r == "SuperAdmin" || r == "Admin");

            if (!isGlobalAdmin && workflow.CurrentRoleId != null)
            {
                var roleIds = await _context.Roles
                    .Where(r => userRoles.Contains(r.Name))
                    .Select(r => r.Id)
                    .ToListAsync();

                if (!roleIds.Contains(workflow.CurrentRoleId))
                {
                    return Failure("You are not authorized to action this KYC at its current level.", 403);
                }
            }

            var (success, message) =
                await _workflowService.RejectAsync(model.WorkflowId, userId, model.Remarks, model.ReturnToPrevious);
            if (!success) return Failure(message);

            return Success(message);
        }

        /// <summary>
        /// Gets the list of KYCs pending for the current user's role.
        /// </summary>
        [HttpGet("pending")]
        [Authorize(Policy = Permissions.Kyc.Workflow)]
        public async Task<IActionResult> GetPendingKycs()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return Failure("User not found.");

            var roles = await _userManager.GetRolesAsync(user);

            var isGlobalReviewer = roles.Any(r => r.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase) ||
                                                  r.Equals("Admin", StringComparison.OrdinalIgnoreCase));

            // NEW: Check if user has GlobalSearch specifically via claims/policies
            var hasGlobalSearch = User.HasClaim(c => c.Type == "Permission" && c.Value == Permissions.Kyc.GlobalSearch);

            var query = _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .ThenInclude(s => s.KycDetail)
                .Where(w => w.Status == KycWorkflowStatus.InReview ||
                            w.Status == KycWorkflowStatus.ResubmissionRequired ||
                            w.Status == KycWorkflowStatus.Rejected);

            if (!isGlobalReviewer)
            {
                // Map role names to IDs for current user to filter items assigned to them
                var roleIds = await _context.Roles
                    .Where(r => roles.Contains(r.Name))
                    .Select(r => r.Id)
                    .ToListAsync();

                query = query.Where(w => roleIds.Contains(w.CurrentRoleId));
            }

            // BRANCH SCOPING
            if (!isGlobalReviewer)
            {
                if (user.BranchId.HasValue)
                {
                    // Staff WITH a branch: see their branch items OR unassigned global items
                    query = query.Where(w => w.BranchId == user.BranchId.Value || w.BranchId == null);
                }
                else
                {
                    // Staff WITHOUT a branch: see ONLY global items (Head Office/Unassigned)
                    // This prevents an empty queue while still hiding other branch's private data
                    query = query.Where(w => w.BranchId == null);
                }
            }

            var pending = await query
                .Include(w => w.KycSession)
                .ThenInclude(s => s.KycDetail)
                .Include(w => w.Branch) // Include Branch info
                .OrderByDescending(w => w.CreatedAt)
                .Select(w => new
                {
                    w.Id,
                    w.KycSessionId,
                    CustomerEmail = w.KycSession != null ? w.KycSession.Email : "Unknown",
                    CustomerName = (w.KycSession != null && w.KycSession.KycDetail != null)
                        ? (w.KycSession.KycDetail.FirstName + " " + w.KycSession.KycDetail.LastName).Trim()
                        : "Applicant",
                    w.PendingLevel,
                    w.CreatedAt,
                    w.LastRemarks,
                    Status = (int)w.Status,
                    CurrentRoleName = _context.Roles.Where(r => r.Id == w.CurrentRoleId).Select(r => r.Name)
                        .FirstOrDefault(),
                    BranchName = w.Branch != null ? w.Branch.Name : "Head Office / Global",
                    TotalLevels =
                        _context.Roles.Count(r => r.OrderLevel.HasValue && r.OrderLevel > w.SubmittedOrderLevel),
                    Chain = (w.FullChain ?? "").Split(" -> ", StringSplitOptions.RemoveEmptyEntries).ToList()
                })
                .ToListAsync();
            return Success(new
            {
                pending
            });
        }

        /// <summary>
        /// Gets a unified, flattened list of all KYCs and their workflow status.
        /// Ideal for high-level administration dashboards.
        /// </summary>
        [HttpGet("unified-list")]
        [Authorize(Policy = Permissions.Kyc.Workflow)]
        public async Task<IActionResult> GetUnifiedList()
        {
            var list = await _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .ThenInclude(s => s.KycDetail)
                .Include(w => w.Branch)
                .OrderByDescending(w => w.CreatedAt)
                .Select(w => new KycUnifiedViewDto
                {
                    WorkflowId = w.Id,
                    KycId = w.KycSession != null && w.KycSession.KycDetail != null ? w.KycSession.KycDetail.Id : 0,
                    CustomerName = w.KycSession != null && w.KycSession.KycDetail != null
                        ? (w.KycSession.KycDetail.FirstName + " " + (w.KycSession.KycDetail.MiddleName ?? "") + " " +
                           w.KycSession.KycDetail.LastName).Trim()
                        : "Unknown",
                    Email = w.KycSession != null ? w.KycSession.Email : "Unknown",
                    MobileNumber = w.KycSession != null && w.KycSession.KycDetail != null
                        ? w.KycSession.KycDetail.MobileNumber
                        : null,

                    BranchName = w.Branch != null ? w.Branch.Name : "Global",
                    Status = w.Status.ToString(),
                    PendingLevel = w.PendingLevel,
                    CurrentRoleName = _context.Roles.Where(r => r.Id == w.CurrentRoleId).Select(r => r.Name)
                        .FirstOrDefault(),
                    SubmittedRoleName = _context.Roles.Where(r => r.Id == w.SubmittedRoleId).Select(r => r.Name)
                        .FirstOrDefault(),
                    FullChain = w.FullChain,
                    CreatedAt = w.CreatedAt,
                    LastUpdatedAt = w.UpdatedAt,
                    LastRemarks = w.LastRemarks
                })
                .ToListAsync();

            return Success(list);
        }

        /// <summary>
        /// Gets the full KYC details for a specific workflow item.
        /// </summary>
        [HttpGet("details/{workflowId}")]
        [Authorize(Policy = Permissions.Kyc.Workflow)]
        public async Task<IActionResult> GetKycDetails(int workflowId)
        {
            var workflow = await _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .ThenInclude(s => s.KycDetail)
                .ThenInclude(d => d.Documents)
                .FirstOrDefaultAsync(w => w.Id == workflowId);

            if (workflow == null) return Failure("Workflow item not found.", 404);

            var logs = await _context.KycApprovalLogs
                .Include(l => l.User)
                .Where(l => l.KycSessionId == workflow.KycSessionId)
                .OrderByDescending(l => l.CreatedAt)
                .Select(log => new
                {
                    log.Id,
                    log.Action,
                    log.Remarks,
                    log.UserId,
                    log.CreatedAt,
                    log.ClientIpAddress,
                    log.UserAgent,
                    ActionedByRoleName = _context.Roles.Where(r => r.Id == log.ActionedByRoleId).Select(r => r.Name)
                        .FirstOrDefault(),
                    ForwardedToRoleName = _context.Roles.Where(r => r.Id == log.ForwardedToRoleId).Select(r => r.Name)
                        .FirstOrDefault(),
                    UserFullName = log.UserId != null ? log.User.Name : "System/Public"
                })
                .ToListAsync();

            // DYNAMIC CHAIN: Build from roles with OrderLevel > submittedOrderLevel
            var chainRoles = await _context.Roles
                .Where(r => r.OrderLevel.HasValue && r.OrderLevel > workflow.SubmittedOrderLevel)
                .OrderBy(r => r.OrderLevel)
                .ToListAsync();

            var approvalChain = chainRoles.Select((r, idx) => new
            {
                StepOrder = idx + 1,
                RoleName = r.Name,
                RoleId = r.Id,
                IsCurrent = r.Id == workflow.CurrentRoleId,
                IsCompleted = r.OrderLevel < workflow.CurrentOrderLevel ||
                              (workflow.Status == KycWorkflowStatus.Approved &&
                               r.OrderLevel <= workflow.CurrentOrderLevel)
            }).ToList();

            // ROBUST DATA FETCH: Ensure details and documents are loaded even if navigation is flaky
            var details = workflow.KycSession?.KycDetail;
            if (details == null && workflow.KycSessionId > 0)
            {
                details = await _context.KycDetails
                    .Include(k => k.Documents)
                    .FirstOrDefaultAsync(k => k.SessionId == workflow.KycSessionId);
            }

            var documents = details?.Documents?.Select(d => (object)new
            {
                d.Id,
                d.DocumentType,
                d.OriginalFileName,
                d.ContentType,
                d.UploadedAt
            }).ToList() ?? new List<object>();

            return Success(new
            {
                workflow = new
                {
                    workflow.Id,
                    workflow.KycSessionId,
                    workflow.Status,
                    workflow.PendingLevel,
                    workflow.CreatedAt,
                    workflow.CurrentRoleId,
                    KycSession = workflow.KycSession != null
                        ? new
                        {
                            workflow.KycSession.Id,
                            workflow.KycSession.Email,
                            workflow.KycSession.FormStatus
                        }
                        : null
                },
                details = details != null
                    ? new
                    {
                        details.Id,
                        details.SessionId,
                        details.FirstName,
                        details.MiddleName,
                        details.LastName,
                        details.Email,
                        details.MobileNumber,
                        details.Gender,
                        details.DateOfBirth,
                        details.Nationality,
                        details.CitizenshipNumber,
                        details.CitizenshipIssuedDistrict,
                        details.CitizenshipIssuedDate,
                        details.PanNumber,
                        details.CurrentState,
                        details.CurrentDistrict,
                        details.CurrentMunicipality,
                        details.CurrentWardNo,
                        details.CurrentStreet,
                        details.PermanentState,
                        details.PermanentDistrict,
                        details.PermanentMunicipality,
                        details.PermanentWardNo,
                        details.PermanentStreet,
                        details.FatherName,
                        details.MotherName,
                        details.GrandFatherName,
                        details.SpouseName,
                        details.SonName,
                        details.DaughterName,
                        details.BankName,
                        details.BankBranch,
                        details.BankAccountNumber,
                        details.BankAccountType,
                        details.Occupation,
                        details.OtherOccupation,
                        details.ServiceSector,
                        details.BusinessType,
                        details.OrganizationName,
                        details.OrganizationAddress,
                        details.Designation,
                        details.EmployeeIdNo,
                        details.AnnualIncome,
                        details.IsPep,
                        details.PepRelation,
                        details.HasBeneficialOwner,
                        details.HasCriminalRecord,
                        details.CriminalRecordDetails,
                        details.AgreeToTerms,
                        details.NoOtherFinancialLiability,
                        details.AllInformationTrue,
                        details.AgreementDate,
                        details.TradingLimit,
                        details.MarginTradingFacility,
                        details.BranchId
                    }
                    : null,
                documents,
                logs,
                approvalChain
            });
        }

        [HttpPost("resubmit")]
        [Authorize]
        public async Task<IActionResult> ResubmitKyc([FromBody] ApprovalModel model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var workflow = await _context.KycWorkflowMasters.FindAsync(model.WorkflowId);
            if (workflow == null) return Failure("Workflow not found.");

            // AUTHORIZATION: Only the current holder of the KYC (the Maker) can resubmit it
            var user = await _userManager.FindByIdAsync(userId);
            var userRoles = await _userManager.GetRolesAsync(user!);
            var isGlobalAdmin = userRoles.Any(r => r == "SuperAdmin" || r == "Admin");

            if (!isGlobalAdmin && workflow.CurrentRoleId != null)
            {
                var roleIds = await _context.Roles
                    .Where(r => userRoles.Contains(r.Name))
                    .Select(r => r.Id)
                    .ToListAsync();

                if (!roleIds.Contains(workflow.CurrentRoleId))
                {
                    return Failure("Only the person currently assigned to this KYC can resubmit it.", 403);
                }
            }

            var (success, message) = await _workflowService.ResubmitAsync(model.WorkflowId, userId, model.Remarks);
            if (!success) return Failure(message);

            return Success(message);
        }

        [HttpPost("pull-back")]
        [Authorize]
        public async Task<IActionResult> PullBackKyc([FromBody] PullBackModel model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var (success, message) = await _workflowService.PullBackAsync(model.WorkflowId, userId);
            if (!success) return Failure(message, 400);

            return Success(message);
        }

        [HttpPost("update-details")]
        [Authorize]
        public async Task<IActionResult> UpdateKycDetails([FromBody] KycUpdateModel model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var workflow = await _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .ThenInclude(s => s.KycDetail)
                .FirstOrDefaultAsync(w => w.Id == model.WorkflowId);

            if (workflow == null) return Failure("Workflow not found.");
            if (workflow.KycSession?.KycDetail == null) return Failure("KYC details not found.");

            // AUTHORIZATION: Check if user is the current holder of the workflow
            var user = await _userManager.FindByIdAsync(userId);
            var userRoles = await _userManager.GetRolesAsync(user!);
            var isGlobalAdmin = userRoles.Any(r => r == "SuperAdmin" || r == "Admin");

            if (!isGlobalAdmin && workflow.CurrentRoleId != null)
            {
                var roleIds = await _context.Roles
                    .Where(r => userRoles.Contains(r.Name))
                    .Select(r => r.Id)
                    .ToListAsync();

                if (!roleIds.Contains(workflow.CurrentRoleId))
                {
                    return Failure("You are not authorized to update this KYC at its current level.", 403);
                }
            }

            // Update allowed fields
            var detail = workflow.KycSession.KycDetail;
            detail.FirstName = model.FirstName ?? detail.FirstName;
            detail.LastName = model.LastName ?? detail.LastName;
            detail.MobileNumber = model.MobileNumber ?? detail.MobileNumber;
            detail.Gender = model.Gender ?? detail.Gender;
            detail.Nationality = model.Nationality ?? detail.Nationality;
            detail.CitizenshipNumber = model.CitizenshipNumber ?? detail.CitizenshipNumber;
            detail.PermanentDistrict = model.PermanentDistrict ?? detail.PermanentDistrict;
            detail.Occupation = model.Occupation ?? detail.Occupation;
            detail.AnnualIncome = model.AnnualIncome ?? detail.AnnualIncome;
            detail.IsPep = model.IsPep ?? detail.IsPep;
            detail.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Success("KYC details updated successfully.");
        }

        public class KycUpdateModel
        {
            public int WorkflowId { get; set; }
            public string? FirstName { get; set; }
            public string? LastName { get; set; }
            public string? MobileNumber { get; set; }
            public string? Gender { get; set; }
            public string? Nationality { get; set; }
            public string? CitizenshipNumber { get; set; }
            public string? PermanentDistrict { get; set; }
            public string? Occupation { get; set; }
            public string? AnnualIncome { get; set; }
            public bool? IsPep { get; set; }
        }

        public class PullBackModel
        {
            public int WorkflowId { get; set; }
        }

        [HttpPost("transfer")]
        [Authorize]
        public async Task<IActionResult> TransferKyc([FromBody] TransferModel model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var (success, message) =
                await _workflowService.TransferBranchAsync(model.WorkflowId, model.NewBranchId, userId);
            if (!success) return Failure(message);

            return Success(message);
        }

        public class TransferModel
        {
            public int WorkflowId { get; set; }
            public int NewBranchId { get; set; }
        }

        /// <summary>
        /// Search for KYC applications across the system using name, nationality ID, or contact.
        /// Integrated with Global Search permissions.
        /// </summary>
        [HttpGet("search")]
        [Authorize(Policy = Permissions.Kyc.Workflow)]
        public async Task<IActionResult> SearchKycs([FromQuery] string? query, [FromQuery] int? branchId)
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return Failure("User not found.");

            var roles = await _userManager.GetRolesAsync(user);
            var isGlobal = roles.Any(r => r == "SuperAdmin" || r == "Admin") ||
                           User.HasClaim(c => c.Type == "Permission" && c.Value == Permissions.Kyc.GlobalSearch);

            var q = _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .ThenInclude(s => s.KycDetail)
                .Include(w => w.Branch)
                .AsQueryable();

            // Apply Search Query
            if (!string.IsNullOrEmpty(query))
            {
                query = query.ToLower().Trim();
                q = q.Where(w =>
                    (w.KycSession.Email.ToLower().Contains(query)) ||
                    (w.KycSession.KycDetail != null && (
                        w.KycSession.KycDetail.FirstName.ToLower().Contains(query) ||
                        w.KycSession.KycDetail.LastName.ToLower().Contains(query) ||
                        w.KycSession.KycDetail.CitizenshipNumber.Contains(query) ||
                        w.KycSession.KycDetail.MobileNumber.Contains(query)
                    ))
                );
            }

            // Apply Branch Filter (If restricted)
            if (!isGlobal)
            {
                q = q.Where(w => w.BranchId == user.BranchId);
            }
            else if (branchId.HasValue)
            {
                q = q.Where(w => w.BranchId == branchId.Value);
            }

            var results = await q
                .OrderByDescending(w => w.CreatedAt)
                .Take(50)
                .Select(w => new KycUnifiedViewDto
                {
                    WorkflowId = w.Id,
                    Status = w.Status.ToString(),
                    PendingLevel = w.PendingLevel,
                    CustomerName = w.KycSession.KycDetail != null
                        ? $"{w.KycSession.KycDetail.FirstName} {w.KycSession.KycDetail.LastName}"
                        : "Unknown",
                    Email = w.KycSession.Email,
                    MobileNumber = w.KycSession.KycDetail != null ? w.KycSession.KycDetail.MobileNumber : "",
                    BranchName = w.Branch != null ? w.Branch.Name : "Global",
                    CreatedAt = w.CreatedAt,
                    LastRemarks = w.LastRemarks
                })
                .ToListAsync();

            return Success(results);
        }

        /// <summary>
        /// Support for branch mobility: Pull an application from another branch to the current user's branch.
        /// </summary>
        [HttpPost("pull-to-my-branch")]
        [Authorize(Policy = Permissions.Kyc.Workflow)]
        public async Task<IActionResult> TransferToMyBranch([FromBody] ApprovalModel model)
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || !user.BranchId.HasValue)
                return Failure("You must be assigned to a branch to perform this action.");

            var workflow = await _context.KycWorkflowMasters.FindAsync(model.WorkflowId);
            if (workflow == null) return NotFound("Workflow not found.");

            // Update branch
            workflow.BranchId = user.BranchId.Value;
            workflow.UpdatedAt = DateTime.UtcNow;

            // Add a log entry for the transfer
            var log = new KycApprovalLog
            {
                KycWorkflowId = workflow.Id,
                KycSessionId = workflow.KycSessionId,
                UserId = userId,
                Action = "BranchTransfer",
                Remarks = $"Application pulled to {user.BranchId} branch for verification.",
                ActionedByRoleId = workflow.CurrentRoleId,
                ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                CreatedAt = DateTime.UtcNow
            };

            _context.KycApprovalLogs.Add(log);
            await _context.SaveChangesAsync();

            return Success("Application successfully transferred to your branch.");
        }

        public class ApprovalModel
        {
            public int WorkflowId { get; set; }
            public string Remarks { get; set; } = string.Empty;
            public bool ReturnToPrevious { get; set; }
        }
    }
}
