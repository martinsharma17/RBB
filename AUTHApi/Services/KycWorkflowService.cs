using AUTHApi.Data;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AUTHApi.Services
{
    public class KycWorkflowService : IKycWorkflowService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public KycWorkflowService(ApplicationDbContext context, UserManager<ApplicationUser> userManager,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _userManager = userManager;
            _httpContextAccessor = httpContextAccessor;
        }

        private string? GetClientIp() => _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
        private string? GetUserAgent() => _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString();

        private async Task<int> GetRoleOrderLevel(string? roleId)
        {
            if (string.IsNullOrEmpty(roleId)) return 0;

            var role = await _context.Roles.FindAsync(roleId);
            if (role == null) return 0;

            if (role.Name == "SuperAdmin") return 0; // Constants

            return role.OrderLevel ?? 0;
        }

        public async Task<(bool success, string message)> InitiateWorkflowAsync(int kycSessionId, string userId)
        {
            var session = await _context.KycFormSessions.FindAsync(kycSessionId);
            if (session == null) return (false, "KYC session not found.");

            string? submittedRoleId = null;
            string initiatorId = userId ?? "Public-User";

            // Prevent duplicate workflow initiation for the same session if it's already in review
            // Prevent duplicate workflow initiation for the same session if it's already in review
            var existingWorkflow = await _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .ThenInclude(s => s.KycDetail)
                .FirstOrDefaultAsync(w => w.KycSessionId == kycSessionId && w.Status == KycWorkflowStatus.InReview);
            if (existingWorkflow != null)
            {
                return (true, "Workflow is already active for this session.");
            }

            // Determine Branch Scope
            int? branchId = null;

            // Priority 1: User Selected Branch (in KycDetail)
            var kycDetail = await _context.KycDetails.FirstOrDefaultAsync(d => d.SessionId == kycSessionId);
            if (kycDetail != null) branchId = kycDetail.BranchId;

            // If userId is provided, try to find the user's role
            if (!string.IsNullOrEmpty(userId) && userId != "System" && userId != "Public")
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    var userRoles = await _userManager.GetRolesAsync(user);
                    var roleName = userRoles.FirstOrDefault();
                    if (!string.IsNullOrEmpty(roleName))
                    {
                        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
                        if (role != null) submittedRoleId = role.Id;
                    }
                }
            }

            // Priority 2: Staff Branch (if not set by applicant)
            if (branchId == null && !string.IsNullOrEmpty(userId) && userId != "System" && userId != "Public")
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null) branchId = user.BranchId;
            }

            // FALLBACK: For public submissions (no userId) or users without explicit roles.
            // In a dynamic system, we default to OrderLevel 0 (Maker).
            int submittedLevel = await GetRoleOrderLevel(submittedRoleId);

            // AUTOMATIC PROGRESSION: Build chain from all roles with Higher OrderLevel than the submitter
            var workflowRoles = await _context.Roles
                .Where(r => r.OrderLevel.HasValue && r.OrderLevel > submittedLevel)
                .OrderBy(r => r.OrderLevel)
                .ToListAsync();

            if (workflowRoles.Count == 0)
            {
                // Edge Case: Submitter is already the highest role or no higher roles configured.
                // We mark as approved directly.
                var directWorkflow = new KycWorkflowMaster
                {
                    KycSessionId = kycSessionId,
                    SubmittedRoleId = submittedRoleId,
                    CurrentRoleId = null,
                    PendingLevel = 0,
                    Status = KycWorkflowStatus.Approved,
                    SubmittedOrderLevel = submittedLevel,
                    CurrentOrderLevel = submittedLevel,
                    FullChain = "Direct Approval",
                    BranchId = branchId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.KycWorkflowMasters.Add(directWorkflow);
                if (session != null) session.FormStatus = 4; // Approved
                await _context.SaveChangesAsync();

                return (true, "KYC submitted and auto-approved as no higher-level roles exist.");
            }

            var firstStepRole = workflowRoles[0];
            string fullChain = string.Join(" -> ", workflowRoles.Select(r => r.Name));

            var workflow = new KycWorkflowMaster
            {
                KycSessionId = kycSessionId,
                SubmittedRoleId = submittedRoleId,
                CurrentRoleId = firstStepRole.Id,
                PendingLevel = workflowRoles.Count,
                Status = KycWorkflowStatus.InReview,
                SubmittedOrderLevel = submittedLevel,
                CurrentOrderLevel = firstStepRole.OrderLevel ?? 0,
                FullChain = fullChain,
                BranchId = branchId,
                CreatedAt = DateTime.UtcNow
            };

            _context.KycWorkflowMasters.Add(workflow);
            if (session != null) session.FormStatus = 2; // Submitted / InReview

            await _context.SaveChangesAsync();

            // LOGGING: Create initiation log
            _context.KycApprovalLogs.Add(new KycApprovalLog
            {
                KycWorkflowId = workflow.Id,
                KycSessionId = kycSessionId,
                UserId = userId == "Public" ? null : userId,
                Action = "Initiated",
                Remarks = "KYC application submitted and workflow started.",
                ActionedByRoleId = submittedRoleId,
                ForwardedToRoleId = firstStepRole.Id,
                ClientIpAddress = GetClientIp(),
                UserAgent = GetUserAgent(),
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return (true, $"KYC submitted. Workflow started at {firstStepRole.Name}. Chain: {fullChain}");
        }

        public async Task<(bool success, string message)> ApproveAsync(int workflowId, string userId, string remarks)
        {
            var workflow = await _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .FirstOrDefaultAsync(w => w.Id == workflowId);

            if (workflow == null) return (false, "Workflow not found.");

            // AUTOMATIC PROGRESSION: Find the NEXT role in the system hierarchy (Smallest OrderLevel > currentLevel)
            var currentLevel = workflow.CurrentOrderLevel;
            var nextRole = await _context.Roles
                .Where(r => r.OrderLevel.HasValue && r.OrderLevel > currentLevel)
                .OrderBy(r => r.OrderLevel)
                .FirstOrDefaultAsync();

            var oldRoleId = workflow.CurrentRoleId;
            workflow.CurrentRoleId = nextRole?.Id;
            workflow.Status = nextRole == null ? KycWorkflowStatus.Approved : KycWorkflowStatus.InReview;
            workflow.LastRemarks = remarks;
            workflow.UpdatedAt = DateTime.UtcNow;

            if (nextRole != null)
            {
                workflow.CurrentOrderLevel = nextRole.OrderLevel ?? 0;

                // Recalculate pending levels (count of roles with OrderLevel >= nextRole.OrderLevel)
                workflow.PendingLevel = await _context.Roles
                    .CountAsync(r => r.OrderLevel.HasValue && r.OrderLevel >= nextRole.OrderLevel);
            }
            else
            {
                workflow.PendingLevel = 0;
                // Update specific session status if fully approved
                var session = await _context.KycFormSessions.FindAsync(workflow.KycSessionId);
                if (session != null) session.FormStatus = 4; // Approved
            }

            // Sync with session if finalized
            if (nextRole == null && workflow.KycSession != null)
            {
                workflow.KycSession.FormStatus = 4; // 4 = Fully Approved
                workflow.KycSession.ModifiedDate = DateTime.UtcNow;
            }

            // LOGGING: Audit Trail
            _context.KycApprovalLogs.Add(new KycApprovalLog
            {
                KycWorkflowId = workflowId,
                KycSessionId = workflow.KycSessionId,
                UserId = userId,
                Action = "Approved",
                Remarks = remarks,
                ActionedByRoleId = oldRoleId,
                ForwardedToRoleId = nextRole?.Id,
                ClientIpAddress = GetClientIp(),
                UserAgent = GetUserAgent(),
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            if (nextRole == null) return (true, "KYC finalized and approved by the highest authority.");

            return (true, $"Approved and moved to {nextRole.Name} (Level {nextRole.OrderLevel}).");
        }

        public async Task<(bool success, string message)> RejectAsync(int workflowId, string userId, string remarks,
            bool returnToPrevious = false)
        {
            var workflow = await _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .FirstOrDefaultAsync(w => w.Id == workflowId);

            if (workflow == null) return (false, "Workflow not found.");

            var oldRoleId = workflow.CurrentRoleId;
            string? targetRoleId = workflow.SubmittedRoleId; // Default: Back to Submitter
            string targetMessage = "KYC rejected and sent back to submitter.";

            if (returnToPrevious)
            {
                // AUTOMATIC HIERARCHY: Find role with Largest OrderLevel < currentLevel but still >= submittedLevel
                var currentLevel = workflow.CurrentOrderLevel;
                var submittedLevel = workflow.SubmittedOrderLevel;

                var prevRole = await _context.Roles
                    .Where(r => r.OrderLevel.HasValue && r.OrderLevel < currentLevel && r.OrderLevel >= submittedLevel)
                    .OrderByDescending(r => r.OrderLevel)
                    .FirstOrDefaultAsync();

                if (prevRole != null)
                {
                    targetRoleId = prevRole.Id;
                    targetMessage = $"KYC returned to {prevRole.Name} (Level {prevRole.OrderLevel}).";
                }
            }
            else
            {
                // REJECT TO MAKER: If the original submitter was Level 0 (Public/Customer),
                // we route it back to the first available staff role (Level 1 Maker) 
                // so staff can manage corrections.
                if (workflow.SubmittedOrderLevel == 0)
                {
                    var makerRole = await _context.Roles
                        .Where(r => r.OrderLevel.HasValue && r.OrderLevel > 0)
                        .OrderBy(r => r.OrderLevel)
                        .FirstOrDefaultAsync();

                    if (makerRole != null)
                    {
                        targetRoleId = makerRole.Id;
                        targetMessage = $"KYC rejected and sent back to {makerRole.Name} (Staff Maker).";
                    }
                }
            }

            // Update workflow state
            workflow.CurrentRoleId = targetRoleId;
            workflow.Status = (targetRoleId == workflow.SubmittedRoleId)
                ? KycWorkflowStatus.ResubmissionRequired
                : KycWorkflowStatus.InReview;
            workflow.LastRemarks = remarks;
            workflow.UpdatedAt = DateTime.UtcNow;
            workflow.CurrentOrderLevel = await GetRoleOrderLevel(targetRoleId);

            // If rejected back to Maker, re-open session for corrections
            if (targetRoleId == workflow.SubmittedRoleId && workflow.KycSession != null)
            {
                workflow.KycSession.FormStatus = 1; // 1 = InProgress
                workflow.KycSession.ModifiedDate = DateTime.UtcNow;
            }

            // LOGGING: Audit Trail
            _context.KycApprovalLogs.Add(new KycApprovalLog
            {
                KycWorkflowId = workflow.Id,
                KycSessionId = workflow.KycSessionId,
                Action = returnToPrevious ? "Returned" : "Rejected",
                Remarks = remarks,
                UserId = userId,
                ActionedByRoleId = oldRoleId,
                ForwardedToRoleId = targetRoleId,
                ClientIpAddress = GetClientIp(),
                UserAgent = GetUserAgent(),
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return (true, targetMessage);
        }

        public async Task<object> GetPendingKycsAsync(string roleId, string userId)
        {
            // BRANCH SCOPING: Helper to get user's branch
            var user = await _userManager.FindByIdAsync(userId);
            int? userBranchId = user?.BranchId;

            return await _context.KycWorkflowMasters
                .Include(w => w.Branch)
                .Include(w => w.KycSession)
                .Where(w => w.CurrentRoleId == roleId)
                .Where(w => w.Status == KycWorkflowStatus.InReview ||
                            w.Status == KycWorkflowStatus.ResubmissionRequired ||
                            w.Status == KycWorkflowStatus.Rejected)
                .Where(w => userBranchId == null || w.BranchId == userBranchId || w.BranchId == null)
                .Select(w => new
                {
                    w.Id,
                    w.KycSessionId,
                    CustomerEmail = w.KycSession != null ? w.KycSession.Email : "Unknown",
                    BranchName = w.Branch != null ? w.Branch.Name : "Head Office / Global",
                    w.PendingLevel,
                    w.CreatedAt,
                    w.LastRemarks,
                    Status = (int)w.Status
                })
                .ToListAsync();
        }

        public async Task<(bool success, string message)> TransferBranchAsync(int workflowId, int newBranchId,
            string userId)
        {
            var workflow = await _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .FirstOrDefaultAsync(w => w.Id == workflowId);

            if (workflow == null) return (false, "Workflow not found.");

            var oldBranchId = workflow.BranchId;
            var newBranch = await _context.Branches.FindAsync(newBranchId);
            if (newBranch == null) return (false, "Target Branch not found.");

            // Update Workflow Branch
            workflow.BranchId = newBranchId;

            // Also update KycDetail to reflect the move (Source of Truth)
            var kycDetail = await _context.KycDetails.FirstOrDefaultAsync(d => d.SessionId == workflow.KycSessionId);
            if (kycDetail != null) kycDetail.BranchId = newBranchId;

            // Log the transfer
            _context.KycApprovalLogs.Add(new KycApprovalLog
            {
                KycWorkflowId = workflowId,
                KycSessionId = workflow.KycSessionId,
                UserId = userId,
                Action = "Transferred",
                Remarks = $"Transferred from Branch ID {oldBranchId} to {newBranch.Name} ({newBranch.Code}).",
                ActionedByRoleId = workflow.CurrentRoleId, // Admin/Manager who performed it
                ForwardedToRoleId = workflow.CurrentRoleId, // Stays with same role, just moves location
                ClientIpAddress = GetClientIp(),
                UserAgent = GetUserAgent(),
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return (true, $"Application successfully transferred to {newBranch.Name}.");
        }

        public async Task<(bool success, string message)> ResubmitAsync(int workflowId, string userId, string remarks)
        {
            var workflow = await _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .FirstOrDefaultAsync(w => w.Id == workflowId);

            if (workflow == null) return (false, "Workflow not found.");

            if (workflow.Status != KycWorkflowStatus.ResubmissionRequired &&
                workflow.Status != KycWorkflowStatus.Rejected &&
                workflow.Status != KycWorkflowStatus.InReview)
            {
                return (false, "Only items requiring action (InReview, Rejected, or Resubmission) can be resubmitted.");
            }

            // AUTOMATIC HIERARCHY: Re-calculate the chain based on dynamic roles
            var submittedLevel = workflow.SubmittedOrderLevel;

            // Find all roles higher than the original submitter
            var workflowRoles = await _context.Roles
                .Where(r => r.OrderLevel.HasValue && r.OrderLevel > submittedLevel)
                .OrderBy(r => r.OrderLevel)
                .ToListAsync();

            if (workflowRoles.Count == 0)
            {
                // Edge case: No higher roles exist (shouldn't happen if it was rejected from somewhere, but safely handle it)
                // If no higher roles, we just approve it? Or keep it in review?
                // Let's assume there must be at least one reviewer if it was rejected previously.
                // But if config changed, maybe no one is above?
                return (false,
                    "System configuration error: No higher authority roles found to review this resubmission.");
            }

            var firstStepRole = workflowRoles[0];

            // Update workflow state
            var oldRoleId = workflow.CurrentRoleId;
            workflow.CurrentRoleId = firstStepRole.Id;
            workflow.PendingLevel = workflowRoles.Count;
            workflow.Status = KycWorkflowStatus.InReview;
            workflow.LastRemarks = remarks;
            workflow.UpdatedAt = DateTime.UtcNow;
            workflow.CurrentOrderLevel = firstStepRole.OrderLevel ?? 0;

            // LOGGING: Audit Trail
            _context.KycApprovalLogs.Add(new KycApprovalLog
            {
                KycWorkflowId = workflow.Id,
                KycSessionId = workflow.KycSessionId,
                Action = "Resubmitted",
                Remarks = remarks,
                UserId = userId,
                ActionedByRoleId = oldRoleId,
                ForwardedToRoleId = firstStepRole.Id,
                ClientIpAddress = GetClientIp(),
                UserAgent = GetUserAgent(),
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return (true, $"KYC resubmitted and moved to {firstStepRole.Name}.");
        }

        public async Task<(bool success, string message)> PullBackAsync(int workflowId, string userId)
        {
            var workflow = await _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .FirstOrDefaultAsync(w => w.Id == workflowId);

            if (workflow == null) return (false, "Workflow not found.");

            if (workflow.Status != KycWorkflowStatus.InReview)
            {
                return (false, "Only items currently in review can be pulled back.");
            }

            // Authorization: The user must have the SubmittedRoleId OR be an Admin
            var user = await _userManager.FindByIdAsync(userId);
            var roles = await _userManager.GetRolesAsync(user!);
            var isGlobalAdmin = roles.Any(r => r == "SuperAdmin" || r == "Admin");

            if (!isGlobalAdmin)
            {
                var roleIds = await _context.Roles
                    .Where(r => roles.Contains(r.Name))
                    .Select(r => r.Id)
                    .ToListAsync();

                if (!roleIds.Contains(workflow.SubmittedRoleId!))
                {
                    return (false, "Only the initiator or an admin can pull back this application.");
                }
            }

            // Update workflow state
            var oldRoleId = workflow.CurrentRoleId;
            workflow.CurrentRoleId = workflow.SubmittedRoleId;
            workflow.Status = KycWorkflowStatus.ResubmissionRequired;
            workflow.LastRemarks = "Application pulled back by initiator.";
            workflow.UpdatedAt = DateTime.UtcNow;
            workflow.CurrentOrderLevel = await GetRoleOrderLevel(workflow.SubmittedRoleId);

            // Log action
            // LOGGING: Audit Trail
            _context.KycApprovalLogs.Add(new KycApprovalLog
            {
                KycWorkflowId = workflow.Id,
                KycSessionId = workflow.KycSessionId,
                Action = "Pulled Back",
                Remarks = "Initiator pulled back the application for editing.",
                UserId = userId,
                ActionedByRoleId = oldRoleId,
                ForwardedToRoleId = workflow.SubmittedRoleId,
                ClientIpAddress = GetClientIp(),
                UserAgent = GetUserAgent(),
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return (true, "KYC pulled back successfully for editing.");
        }
    }
}
