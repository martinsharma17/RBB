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
        [Authorize] // Handled via manual check for Verify OR Approve
        public async Task<IActionResult> ApproveKyc([FromBody] ApprovalModel model)
        {
            if (!User.HasClaim(c =>
                    c.Type == "Permission" &&
                    (c.Value == Permissions.Kyc.Approve || c.Value == Permissions.Kyc.Verify)))
            {
                return Failure("You do not have permission to approve/verify KYC applications.", 403);
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var (success, message) = await _workflowService.ApproveAsync(model.WorkflowId, userId, model.Remarks);
            if (!success) return Failure(message);

            return Success(message);
        }

        /// <summary>
        /// Staff action to reject a KYC.
        /// </summary>
        [HttpPost("reject")]
        [Authorize] // Handled via manual check for Reject OR Verify
        public async Task<IActionResult> RejectKyc([FromBody] ApprovalModel model)
        {
            if (!User.HasClaim(c =>
                    c.Type == "Permission" && (c.Value == Permissions.Kyc.Reject || c.Value == Permissions.Kyc.Verify)))
            {
                return Failure("You do not have permission to reject/return KYC applications.", 403);
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

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
                .Where(w => w.Status == KycWorkflowStatus.InReview);

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
                .Where(l => l.KycWorkflowId == workflowId)
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

        public class ApprovalModel
        {
            public int WorkflowId { get; set; }
            public string Remarks { get; set; } = string.Empty;
            public bool ReturnToPrevious { get; set; }
        }
    }
}
