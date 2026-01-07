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

        public KycWorkflowService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        private async Task<int> GetRoleOrderLevel(string? roleId)
        {
            if (string.IsNullOrEmpty(roleId)) return 0;
            var role = await _context.Roles.FindAsync(roleId);
            if (role == null) return 0;
            return role.Name switch
            {
                "User" => 0,
                "Maker" => 1,
                "Checker" => 2,
                "RBBSec" => 3,
                _ => 0
            };
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

            // Load config with pre-ordered steps
            var config = await _context.KycApprovalConfigs
                .Include(c => c.Steps.OrderBy(s => s.StepOrder))
                .FirstOrDefaultAsync(c => c.RoleId == submittedRoleId);

            // Fallback: If no config for the specific role, try to get the "User" role's config
            if (config == null)
            {
                var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
                if (userRole != null)
                {
                    config = await _context.KycApprovalConfigs
                        .Include(c => c.Steps.OrderBy(s => s.StepOrder))
                        .FirstOrDefaultAsync(c => c.RoleId == userRole.Id);
                }
            }

            // Ultimate Fallback: Get the first available config
            if (config == null)
            {
                config = await _context.KycApprovalConfigs
                    .Include(c => c.Steps.OrderBy(s => s.StepOrder))
                    .FirstOrDefaultAsync();
            }

            if (config == null)
            {
                return (false, "No valid KYC approval workflow configurations found. Please seed steps.");
            }

            var steps = config.Steps.OrderBy(s => s.StepOrder).ToList();

            // Build visual chain string
            var chainNames = new List<string>();
            foreach (var s in steps)
            {
                var r = await _context.Roles.FindAsync(s.RoleId);
                if (r != null) chainNames.Add(r.Name);
            }

            string fullChain = string.Join(" -> ", chainNames);

            // Get Order Levels
            int submittedLevel = await GetRoleOrderLevel(submittedRoleId);

            // Case: Direct Approval (for Roles like RBBSec)
            if (steps.Count == 0)
            {
                var directWorkflow = new KycWorkflowMaster
                {
                    KycSessionId = kycSessionId,
                    SubmittedRoleId = submittedRoleId,
                    CurrentRoleId = null, // No current active role
                    PendingLevel = 0,
                    Status = KycWorkflowStatus.Approved,
                    SubmittedOrderLevel = submittedLevel,
                    CurrentOrderLevel = submittedLevel, // Finalized
                    FullChain = "Direct Approval",
                    CreatedAt = DateTime.UtcNow
                };
                _context.KycWorkflowMasters.Add(directWorkflow);

                if (session != null)
                {
                    session.FormStatus = 4; // Fully Approved
                }

                await _context.SaveChangesAsync();

                var directLog = new KycApprovalLog
                {
                    KycWorkflowId = directWorkflow.Id,
                    KycSessionId = kycSessionId,
                    Action = "Auto-Approved",
                    Remarks = "KYC submitted by authoritative role. Direct approval granted.",
                    UserId = initiatorId == "Public-User" || initiatorId == "System" ? null : initiatorId,
                    ActionedByRoleId = submittedRoleId,
                    ForwardedToRoleId = null,
                    CreatedAt = DateTime.UtcNow
                };
                _context.KycApprovalLogs.Add(directLog);
                await _context.SaveChangesAsync();

                return (true, "KYC submitted and auto-approved directly.");
            }

            var firstStep = steps[0];

            var workflow = new KycWorkflowMaster
            {
                KycSessionId = kycSessionId,
                SubmittedRoleId = submittedRoleId,
                CurrentRoleId = firstStep.RoleId,
                PendingLevel = steps.Count,
                Status = KycWorkflowStatus.InReview,
                SubmittedOrderLevel = submittedLevel,
                CurrentOrderLevel = await GetRoleOrderLevel(firstStep.RoleId),
                FullChain = fullChain,
                CreatedAt = DateTime.UtcNow
            };

            _context.KycWorkflowMasters.Add(workflow);
            await _context.SaveChangesAsync();

            // Log the initiation
            var log = new KycApprovalLog
            {
                KycWorkflowId = workflow.Id,
                KycSessionId = kycSessionId,
                Action = "Submitted",
                Remarks = "KYC submitted for approval.",
                UserId = initiatorId == "Public-User" || initiatorId == "System" ? null : initiatorId,
                ActionedByRoleId = submittedRoleId,
                ForwardedToRoleId = firstStep.RoleId,
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

            // Get original submitter's config and its steps
            var config = await _context.KycApprovalConfigs
                .Include(c => c.Steps.OrderBy(s => s.StepOrder))
                .FirstOrDefaultAsync(c => c.RoleId == workflow.SubmittedRoleId);

            if (config == null) return (false, "Workflow configuration lost.");

            var steps = config.Steps.OrderBy(s => s.StepOrder).ToList();
            var currentStep = steps.FirstOrDefault(s => s.RoleId == workflow.CurrentRoleId);

            if (currentStep == null) return (false, "Current level not found in the chain.");

            var nextStep = steps.FirstOrDefault(s => s.StepOrder == currentStep.StepOrder + 1);

            // Update workflow state
            var oldRoleId = workflow.CurrentRoleId;
            workflow.CurrentRoleId = nextStep?.RoleId;
            workflow.PendingLevel = nextStep == null ? 0 : steps.Count - (nextStep.StepOrder);
            workflow.Status = nextStep == null ? KycWorkflowStatus.Approved : KycWorkflowStatus.InReview;
            workflow.LastRemarks = remarks;
            workflow.UpdatedAt = DateTime.UtcNow;

            // Update Order Level
            if (nextStep != null)
            {
                workflow.CurrentOrderLevel = await GetRoleOrderLevel(nextStep.RoleId);
            }

            // Sync with session if finalized
            if (nextStep == null && workflow.KycSession != null)
            {
                workflow.KycSession.FormStatus = 4; // 4 = Fully Approved
                workflow.KycSession.ModifiedDate = DateTime.UtcNow;
            }

            // Log action
            var log = new KycApprovalLog
            {
                KycWorkflowId = workflow.Id,
                KycSessionId = workflow.KycSessionId,
                Action = "Approved",
                Remarks = remarks,
                UserId = userId,
                ActionedByRoleId = oldRoleId,
                ForwardedToRoleId = nextStep?.RoleId,
                CreatedAt = DateTime.UtcNow
            };

            _context.KycApprovalLogs.Add(log);
            await _context.SaveChangesAsync();

            if (nextStep == null) return (true, "KYC finalized and approved.");

            // Try to find the role name for the message
            var nextRole = await _context.Roles.FindAsync(nextStep.RoleId);
            return (true, $"Approved and moved to {nextRole?.Name ?? "next level"}.");
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
            string targetMessage = "KYC rejected and sent back to submitter (Maker).";

            if (returnToPrevious)
            {
                var config = await _context.KycApprovalConfigs
                    .Include(c => c.Steps.OrderBy(s => s.StepOrder))
                    .FirstOrDefaultAsync(c => c.RoleId == workflow.SubmittedRoleId);

                if (config != null)
                {
                    var steps = config.Steps.OrderBy(s => s.StepOrder).ToList();
                    var currentStep = steps.FirstOrDefault(s => s.RoleId == workflow.CurrentRoleId);

                    if (currentStep != null && currentStep.StepOrder > 0)
                    {
                        var prevStep = steps.FirstOrDefault(s => s.StepOrder == currentStep.StepOrder - 1);
                        if (prevStep != null)
                        {
                            targetRoleId = prevStep.RoleId;
                            var prevRole = await _context.Roles.FindAsync(prevStep.RoleId);
                            targetMessage = $"KYC returned to previous level: {prevRole?.Name ?? "Previous"}.";
                        }
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

            var log = new KycApprovalLog
            {
                KycWorkflowId = workflow.Id,
                KycSessionId = workflow.KycSessionId,
                Action = returnToPrevious ? "Returned" : "Rejected",
                Remarks = remarks,
                UserId = userId,
                ActionedByRoleId = oldRoleId,
                ForwardedToRoleId = targetRoleId,
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

        public async Task<(bool success, string message)> ResubmitAsync(int workflowId, string userId, string remarks)
        {
            var workflow = await _context.KycWorkflowMasters
                .Include(w => w.KycSession)
                .FirstOrDefaultAsync(w => w.Id == workflowId);

            if (workflow == null) return (false, "Workflow not found.");

            if (workflow.Status != KycWorkflowStatus.ResubmissionRequired &&
                workflow.Status != KycWorkflowStatus.Rejected)
            {
                return (false, "Only rejected or resubmission items can be resubmitted.");
            }

            // Get original submitter's config and its steps
            var config = await _context.KycApprovalConfigs
                .Include(c => c.Steps.OrderBy(s => s.StepOrder))
                .FirstOrDefaultAsync(c => c.RoleId == workflow.SubmittedRoleId);

            if (config == null) return (false, "Workflow configuration lost.");

            var steps = config.Steps.OrderBy(s => s.StepOrder).ToList();
            if (steps.Count == 0) return (false, "No approval steps defined for this workflow.");

            var firstStep = steps[0];

            // Update workflow state
            var oldRoleId = workflow.CurrentRoleId;
            workflow.CurrentRoleId = firstStep.RoleId;
            workflow.PendingLevel = steps.Count;
            workflow.Status = KycWorkflowStatus.InReview;
            workflow.LastRemarks = remarks;
            workflow.UpdatedAt = DateTime.UtcNow;
            workflow.CurrentOrderLevel = await GetRoleOrderLevel(firstStep.RoleId);

            // Log action
            var log = new KycApprovalLog
            {
                KycWorkflowId = workflow.Id,
                KycSessionId = workflow.KycSessionId,
                Action = "Resubmitted",
                Remarks = remarks,
                UserId = userId,
                ActionedByRoleId = oldRoleId,
                ForwardedToRoleId = firstStep.RoleId,
                CreatedAt = DateTime.UtcNow
            };

            _context.KycApprovalLogs.Add(log);
            await _context.SaveChangesAsync();

            var nextRole = await _context.Roles.FindAsync(firstStep.RoleId);
            return (true, $"KYC resubmitted and moved to {nextRole?.Name ?? "first level"}.");
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
            var log = new KycApprovalLog
            {
                KycWorkflowId = workflow.Id,
                KycSessionId = workflow.KycSessionId,
                Action = "Pulled Back",
                Remarks = "Initiator pulled back the application for editing.",
                UserId = userId,
                ActionedByRoleId = oldRoleId,
                ForwardedToRoleId = workflow.SubmittedRoleId,
                CreatedAt = DateTime.UtcNow
            };

            _context.KycApprovalLogs.Add(log);
            await _context.SaveChangesAsync();

            return (true, "KYC pulled back successfully for editing.");
        }
    }
}
