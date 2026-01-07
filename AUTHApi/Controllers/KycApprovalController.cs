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

            var isGlobalReviewer = roles.Any(r => r.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase)
                                                  || r.Equals("Admin", StringComparison.OrdinalIgnoreCase));

            var query = _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .Where(w => w.Status == KycWorkflowStatus.InReview ||
                            w.Status == KycWorkflowStatus.ResubmissionRequired ||
                            w.Status == KycWorkflowStatus.Rejected);

            if (!isGlobalReviewer)
            {
                // Map role names to IDs
                var roleIds = await _context.Roles
                    .Where(r => roles.Contains(r.Name))
                    .Select(r => r.Id)
                    .ToListAsync();

                query = query.Where(w => roleIds.Contains(w.CurrentRoleId));
            }

            var pending = await query
                .Include(w => w.KycSession)
                .OrderByDescending(w => w.CreatedAt)
                .Select(w => new
                {
                    w.Id,
                    w.KycSessionId,
                    CustomerEmail = w.KycSession != null ? w.KycSession.Email : "Unknown",
                    w.PendingLevel,
                    w.CreatedAt,
                    w.LastRemarks,
                    Status = (int)w.Status,
                    CurrentRoleName = _context.Roles.Where(r => r.Id == w.CurrentRoleId).Select(r => r.Name)
                        .FirstOrDefault(),
                    TotalLevels = _context.KycApprovalSteps.Count(s =>
                        _context.KycApprovalConfigs.Any(c => c.Id == s.ConfigId && c.RoleId == w.SubmittedRoleId)),
                    Chain = (w.FullChain ?? "").Split(" -> ", StringSplitOptions.RemoveEmptyEntries).ToList()
                })
                .ToListAsync();

            return Success(new { pending });
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
                    ActionedByRoleName = _context.Roles.Where(r => r.Id == log.ActionedByRoleId).Select(r => r.Name)
                        .FirstOrDefault(),
                    ForwardedToRoleName = _context.Roles.Where(r => r.Id == log.ForwardedToRoleId).Select(r => r.Name)
                        .FirstOrDefault(),
                    UserFullName = log.UserId != null ? log.User.Name : "System/Public"
                })
                .ToListAsync();

            var approvalChain = await _context.KycApprovalSteps
                .Where(s => _context.KycApprovalConfigs.Any(c =>
                    c.Id == s.ConfigId && c.RoleId == workflow.SubmittedRoleId))
                .OrderBy(s => s.StepOrder)
                .Select(s => new
                {
                    s.StepOrder,
                    RoleName = _context.Roles.Where(r => r.Id == s.RoleId).Select(r => r.Name).FirstOrDefault(),
                    s.RoleId,
                    IsCurrent = s.RoleId == workflow.CurrentRoleId,
                    IsCompleted = _context.KycApprovalLogs.Any(l =>
                        l.KycWorkflowId == workflowId && l.ActionedByRoleId == s.RoleId && l.Action == "Approved")
                })
                .ToListAsync();

            return Success(new
            {
                workflow,
                details = workflow.KycSession?.KycDetail,
                documents = workflow.KycSession?.KycDetail?.Documents,
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

        public class ApprovalModel
        {
            public int WorkflowId { get; set; }
            public string Remarks { get; set; } = string.Empty;
            public bool ReturnToPrevious { get; set; }
        }
    }
}
