using AUTHApi.Data;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AUTHApi.Services
{
    public class KycWorkflowService : IKycWorkflowService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public KycWorkflowService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<(bool success, string message)> InitiateWorkflowAsync(int kycSessionId, string userId)
        {
            var session = await _context.KycFormSessions.FindAsync(kycSessionId);
            if (session == null) return (false, "KYC session not found.");

            string? submittedRoleId = null;
            string initiatorId = userId ?? "Public-User";

            // Prevent duplicate workflow initiation for the same session if it's already in review
            var existingWorkflow = await _context.KycWorkflowMasters
                .FirstOrDefaultAsync(w => w.KycSessionId == kycSessionId && w.Status == KycWorkflowStatus.InReview);
            if (existingWorkflow != null)
            {
                return (true, "Workflow is already active for this session.");
            }

            // If userId is provided, try to find the user's role
            if (!string.IsNullOrEmpty(userId) && userId != "System" && userId != "Public")
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    var userRoles = await _userManager.GetRolesAsync(user);
                    var roleName = userRoles.FirstOrDefault() ?? "User";
                    var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
                    if (role != null) submittedRoleId = role.Id;
                }
            }

            // Fallback for public submissions or users without valid roles
            if (submittedRoleId == null)
            {
                var defaultRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
                if (defaultRole == null) return (false, "Default 'User' role for submission configuration not found.");
                submittedRoleId = defaultRole.Id;
            }

            var config = await _context.KycApprovalConfigs.FirstOrDefaultAsync(c => c.RoleId == submittedRoleId);

            // Fallback: If no config for the specific role, try to get the "User" role's config
            if (config == null)
            {
                var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
                if (userRole != null)
                {
                    config = await _context.KycApprovalConfigs.FirstOrDefaultAsync(c => c.RoleId == userRole.Id);
                }
            }

            // Ultimate Fallback: Get the first available config
            if (config == null)
            {
                config = await _context.KycApprovalConfigs.FirstOrDefaultAsync();
            }

            if (config == null)
            {
                return (false,
                    "No KYC approval workflow configurations found in the system. Please seed configurations.");
            }

            var chain = JsonSerializer.Deserialize<List<string>>(config.ApprovalChain) ?? new List<string>();
            if (chain.Count == 0)
            {
                return (false, "Approval chain is empty.");
            }

            // Get the first role in the chain
            var firstRoleName = chain[0];
            var firstRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == firstRoleName);
            if (firstRole == null) return (false, $"Next role '{firstRoleName}' in chain not found.");

            var workflow = new KycWorkflowMaster
            {
                KycSessionId = kycSessionId,
                SubmittedRoleId = submittedRoleId,
                CurrentRoleId = firstRole.Id,
                PendingLevel = chain.Count,
                Status = KycWorkflowStatus.InReview,
                CreatedAt = DateTime.UtcNow
            };

            _context.KycWorkflowMasters.Add(workflow);
            await _context.SaveChangesAsync();

            // Log the initiation
            var log = new KycApprovalLog
            {
                KycWorkflowId = workflow.Id,
                Action = "Submitted",
                Remarks = "KYC submitted for approval.",
                // Only set UserId if it's a real user ID (not "Public-User" or "System")
                UserId = (initiatorId == "Public-User" || initiatorId == "System") ? null : initiatorId,
                FromRoleId = submittedRoleId,
                ToRoleId = firstRole.Id,
                CreatedAt = DateTime.UtcNow
            };

            _context.KycApprovalLogs.Add(log);
            await _context.SaveChangesAsync();

            return (true, "Workflow initiated successfully.");
        }

        public async Task<(bool success, string message)> ApproveAsync(int workflowId, string userId, string remarks)
        {
            var workflow = await _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .FirstOrDefaultAsync(w => w.Id == workflowId);

            if (workflow == null) return (false, "Workflow not found.");

            // Get original submitter's config to find the chain
            var config =
                await _context.KycApprovalConfigs.FirstOrDefaultAsync(c => c.RoleId == workflow.SubmittedRoleId);
            if (config == null) return (false, "Workflow configuration lost.");

            var chain = JsonSerializer.Deserialize<List<string>>(config.ApprovalChain) ?? new List<string>();

            // Find current role name
            var currentRole = await _context.Roles.FindAsync(workflow.CurrentRoleId);
            if (currentRole == null) return (false, "Current role invalid.");

            int currentIndex = chain.IndexOf(currentRole.Name);
            string? nextRoleName =
                (currentIndex >= 0 && currentIndex < chain.Count - 1) ? chain[currentIndex + 1] : null;

            string? nextRoleId = null;
            if (nextRoleName != null)
            {
                var nextRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == nextRoleName);
                if (nextRole == null) return (false, $"Next role '{nextRoleName}' in chain not found.");
                nextRoleId = nextRole.Id;
            }

            // Update workflow state
            var oldRoleId = workflow.CurrentRoleId;
            workflow.CurrentRoleId = nextRoleId;
            workflow.PendingLevel = nextRoleName == null ? 0 : workflow.PendingLevel - 1;
            workflow.Status = nextRoleName == null ? KycWorkflowStatus.Approved : KycWorkflowStatus.InReview;
            workflow.LastRemarks = remarks;
            workflow.UpdatedAt = DateTime.UtcNow;

            // Sync with session if finalized
            if (nextRoleName == null && workflow.KycSession != null)
            {
                workflow.KycSession.FormStatus = 4; // 4 = Fully Approved
                workflow.KycSession.ModifiedDate = DateTime.UtcNow;
            }

            // Log action
            var log = new KycApprovalLog
            {
                KycWorkflowId = workflow.Id,
                Action = "Approved",
                Remarks = remarks,
                UserId = userId,
                FromRoleId = oldRoleId,
                ToRoleId = nextRoleId,
                CreatedAt = DateTime.UtcNow
            };

            _context.KycApprovalLogs.Add(log);
            await _context.SaveChangesAsync();

            return (true,
                nextRoleName == null ? "KYC finalized and approved." : $"Approved and moved to {nextRoleName}.");
        }

        public async Task<(bool success, string message)> RejectAsync(int workflowId, string userId, string remarks,
            bool returnToPrevious = false)
        {
            var workflow = await _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .FirstOrDefaultAsync(w => w.Id == workflowId);

            if (workflow == null) return (false, "Workflow not found.");

            var oldRoleId = workflow.CurrentRoleId;
            string? targetRoleId = workflow.SubmittedRoleId; // Default: Back to Maker
            string targetMessage = "KYC rejected and sent back to submitter (Maker).";

            if (returnToPrevious)
            {
                // Find previous role in chain
                var config =
                    await _context.KycApprovalConfigs.FirstOrDefaultAsync(c => c.RoleId == workflow.SubmittedRoleId);
                if (config != null)
                {
                    var chain = JsonSerializer.Deserialize<List<string>>(config.ApprovalChain) ?? new List<string>();
                    var currentRole = await _context.Roles.FindAsync(workflow.CurrentRoleId);
                    if (currentRole != null)
                    {
                        int currentIndex = chain.IndexOf(currentRole.Name);
                        if (currentIndex > 0)
                        {
                            var prevRoleName = chain[currentIndex - 1];
                            var prevRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == prevRoleName);
                            if (prevRole != null)
                            {
                                targetRoleId = prevRole.Id;
                                targetMessage = $"KYC returned to previous level: {prevRoleName}.";
                            }
                        }
                    }
                }
            }

            // Update workflow state
            workflow.CurrentRoleId = targetRoleId;
            workflow.Status = KycWorkflowStatus.Rejected;
            workflow.LastRemarks = remarks;
            workflow.UpdatedAt = DateTime.UtcNow;

            // If rejected back to Maker, re-open session for corrections
            if (targetRoleId == workflow.SubmittedRoleId && workflow.KycSession != null)
            {
                workflow.KycSession.FormStatus = 1; // 1 = InProgress
                workflow.KycSession.ModifiedDate = DateTime.UtcNow;
            }

            var log = new KycApprovalLog
            {
                KycWorkflowId = workflow.Id,
                Action = returnToPrevious ? "Returned" : "Rejected",
                Remarks = remarks,
                UserId = userId,
                FromRoleId = oldRoleId,
                ToRoleId = targetRoleId,
                CreatedAt = DateTime.UtcNow
            };

            _context.KycApprovalLogs.Add(log);
            await _context.SaveChangesAsync();

            return (true, targetMessage);
        }

        public async Task<object> GetPendingKycsAsync(string roleId)
        {
            return await _context.KycWorkflowMasters
                .Where(w => w.CurrentRoleId == roleId && w.Status == KycWorkflowStatus.InReview)
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
        }
    }
}
