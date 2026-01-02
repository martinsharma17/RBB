using AUTHApi.Data;
using AUTHApi.Entities;
using AUTHApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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
        [Authorize(Roles = "Maker,Checker,RBBSec,Admin,SuperAdmin")]
        public async Task<IActionResult> ApproveKyc([FromBody] ApprovalModel model)
        {
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
        [Authorize(Roles = "Maker,Checker,RBBSec,Admin,SuperAdmin")]
        public async Task<IActionResult> RejectKyc([FromBody] ApprovalModel model)
        {
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
        [Authorize(Roles = "Maker,Checker,RBBSec,Admin,SuperAdmin")]
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
                    w.LastRemarks
                })
                .ToListAsync();

            return Success(new { pending });
        }

        /// <summary>
        /// Gets the full KYC details for a specific workflow item.
        /// </summary>
        [HttpGet("details/{workflowId}")]
        [Authorize(Roles = "Maker,Checker,RBBSec,Admin,SuperAdmin")]
        public async Task<IActionResult> GetKycDetails(int workflowId)
        {
            var workflow = await _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .ThenInclude(s => s.KycDetail)
                .ThenInclude(d => d.Documents)
                .FirstOrDefaultAsync(w => w.Id == workflowId);

            if (workflow == null) return Failure("Workflow item not found.", 404);

            var logs = await _context.KycApprovalLogs
                .Where(l => l.KycWorkflowId == workflowId)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();

            return Success(new
            {
                workflow,
                details = workflow.KycSession?.KycDetail,
                history = logs
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
