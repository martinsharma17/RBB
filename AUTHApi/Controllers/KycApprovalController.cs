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
using System.Collections.Generic;
using System.Linq;
using System;
using System.Threading.Tasks;
using System.Text;

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
                    .Where(r => userRoles.Contains(r.Name!))
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
        /// Gets summary statistics for the KYC dashboard, scoped by role and branch.
        /// </summary>
        [HttpGet("dashboard-stats")]
        [Authorize(Policy = Permissions.Kyc.Dashboard)]
        public async Task<IActionResult> GetDashboardStats([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            try
            {
                var userId = CurrentUserId;
                if (string.IsNullOrEmpty(userId)) return Unauthorized();

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null) return Failure("User not found.");

                var roles = await _userManager.GetRolesAsync(user);
                var isGlobal = roles.Any(r => r == "SuperAdmin" || r == "Admin");

                var query = _context.KycWorkflowMasters.AsQueryable();

                // Date Filtering (Ensuring UTC Kind for Postgres/Npgsql compatibility)
                if (fromDate.HasValue)
                {
                    var start = DateTime.SpecifyKind(fromDate.Value.Date, DateTimeKind.Utc);
                    query = query.Where(w => w.CreatedAt >= start);
                }

                if (toDate.HasValue)
                {
                    var end = DateTime.SpecifyKind(toDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
                    query = query.Where(w => w.CreatedAt <= end);
                }

                // Role & Branch Scoping
                if (!isGlobal)
                {
                    // Filter by Branch
                    if (user.BranchId.HasValue)
                    {
                        var bid = user.BranchId.Value;
                        query = query.Where(w => w.BranchId == bid || w.BranchId == null);
                    }
                    else
                    {
                        query = query.Where(w => w.BranchId == null);
                    }
                }

                query = query.AsNoTracking();

                var stats = new KycDashboardDto
                {
                    TotalSubmitted = await query.CountAsync(),
                    PendingApproval = await query.CountAsync(w => w.Status == KycWorkflowStatus.InReview),
                    Approved = await query.CountAsync(w => w.Status == KycWorkflowStatus.Approved),
                    Rejected = await query.CountAsync(w => w.Status == KycWorkflowStatus.Rejected),
                    ResubmissionRequired =
                        await query.CountAsync(w => w.Status == KycWorkflowStatus.ResubmissionRequired)
                };

                // Status Distribution for Pie Chart
                stats.StatusDistribution = new List<KycStatusCountDto>
                {
                    new() { Status = "Pending", Count = stats.PendingApproval },
                    new() { Status = "Approved", Count = stats.Approved },
                    new() { Status = "Rejected", Count = stats.Rejected },
                    new() { Status = "Resubmission", Count = stats.ResubmissionRequired }
                };

                // Trend Calculation (Last 7 Days or Specified Range)
                var rangeStart =
                    DateTime.SpecifyKind(fromDate?.Date ?? DateTime.UtcNow.Date.AddDays(-6), DateTimeKind.Utc);
                var rangeEnd = DateTime.SpecifyKind(toDate?.Date ?? DateTime.UtcNow.Date, DateTimeKind.Utc);

                // Limit trend to max 31 days
                if ((rangeEnd - rangeStart).TotalDays > 31)
                {
                    rangeStart = rangeEnd.AddDays(-30);
                }

                // [FIX] More robust date grouping
                var rawTrendData = await query
                    .Where(w => w.CreatedAt >= rangeStart && w.CreatedAt <= rangeEnd.AddDays(1))
                    .GroupBy(w => w.CreatedAt.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                // Convert raw data to a lookup dictionary in memory, handling potential dups safely
                var trendMap = new Dictionary<string, int>();
                foreach (var item in rawTrendData)
                {
                    var key = item.Date.Date.ToString("yyyy-MM-dd");
                    if (!trendMap.ContainsKey(key))
                        trendMap[key] = item.Count;
                    else
                        trendMap[key] += item.Count;
                }

                // Fill in missing dates with zero
                for (var dt = rangeStart; dt <= rangeEnd; dt = dt.AddDays(1))
                {
                    var dateStr = dt.ToString("yyyy-MM-dd");
                    stats.DailyTrend.Add(new KycTrendDto
                    {
                        Date = dateStr,
                        Count = trendMap.TryGetValue(dateStr, out var count) ? count : 0
                    });
                }

                return Success(stats);
            }
            catch (Exception ex)
            {
                return InternalServerError($"Dashboard error: {ex.Message} {ex.InnerException?.Message}");
            }
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
                    .Where(r => userRoles.Contains(r.Name!))
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


            var query = _context.KycWorkflowMasters
                .Include(w => w.KycSession!)
                .ThenInclude(s => s.KycDetail!)
                .Where(w => w.Status == KycWorkflowStatus.InReview ||
                            w.Status == KycWorkflowStatus.ResubmissionRequired ||
                            w.Status == KycWorkflowStatus.Rejected);

            if (!isGlobalReviewer)
            {
                // Map role names to IDs for current user to filter items assigned to them
                var roleIds = await _context.Roles
                    .Where(r => roles.Contains(r.Name!))
                    .Select(r => r.Id)
                    .ToListAsync();

                query = query.Where(w => roleIds.Contains(w.CurrentRoleId!));
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
                .Include(w => w.KycSession!)
                .ThenInclude(s => s.KycDetail!)
                .Include(w => w.Branch!) // Include Branch info
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
                .Include(w => w.KycSession!)
                .ThenInclude(s => s.KycDetail!)
                .Include(w => w.Branch!)
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
                .Include(w => w.KycSession!)
                .ThenInclude(s => s.KycDetail!)
                .ThenInclude(d => d!.Documents!)
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
                    UserFullName = log.UserId != null ? log.User!.Name : "System/Public"
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
                    .Where(r => userRoles.Contains(r.Name!))
                    .Select(r => r.Id)
                    .ToListAsync();

                if (!roleIds.Contains(workflow.CurrentRoleId!))
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
                    .Where(r => userRoles.Contains(r.Name!))
                    .Select(r => r.Id)
                    .ToListAsync();

                if (!roleIds.Contains(workflow.CurrentRoleId!))
                {
                    return Failure("You are not authorized to update this KYC at its current level.", 403);
                }
            }

            // Update allowed fields
            var detail = workflow.KycSession.KycDetail;
            detail.FirstName = model.FirstName ?? detail.FirstName;
            detail.MiddleName = model.MiddleName ?? detail.MiddleName;
            detail.LastName = model.LastName ?? detail.LastName;
            detail.MobileNumber = model.MobileNumber ?? detail.MobileNumber;
            detail.Gender = model.Gender ?? detail.Gender;
            detail.DateOfBirth = model.DateOfBirth ?? detail.DateOfBirth;
            detail.Nationality = model.Nationality ?? detail.Nationality;
            detail.MaritalStatus = model.MaritalStatus ?? detail.MaritalStatus;
            detail.CitizenshipNumber = model.CitizenshipNumber ?? detail.CitizenshipNumber;
            detail.CitizenshipIssuedDistrict = model.CitizenshipIssuedDistrict ?? detail.CitizenshipIssuedDistrict;
            detail.CitizenshipIssuedDate = model.CitizenshipIssuedDate ?? detail.CitizenshipIssuedDate;

            // Address
            detail.PermanentState = model.PermanentState ?? detail.PermanentState;
            detail.PermanentDistrict = model.PermanentDistrict ?? detail.PermanentDistrict;
            detail.PermanentMunicipality = model.PermanentMunicipality ?? detail.PermanentMunicipality;
            detail.PermanentWardNo = model.PermanentWardNo?.ToString() ?? detail.PermanentWardNo;
            detail.PermanentStreet = model.PermanentStreet ?? detail.PermanentStreet;

            detail.CurrentState = model.CurrentState ?? detail.CurrentState;
            detail.CurrentDistrict = model.CurrentDistrict ?? detail.CurrentDistrict;
            detail.CurrentMunicipality = model.CurrentMunicipality ?? detail.CurrentMunicipality;
            detail.CurrentWardNo = model.CurrentWardNo?.ToString() ?? detail.CurrentWardNo;
            detail.CurrentStreet = model.CurrentStreet ?? detail.CurrentStreet;

            // Family
            detail.FatherName = model.FatherName ?? detail.FatherName;
            detail.MotherName = model.MotherName ?? detail.MotherName;
            detail.GrandFatherName = model.GrandFatherName ?? detail.GrandFatherName;
            detail.SpouseName = model.SpouseName ?? detail.SpouseName;

            // Bank & Financial
            detail.BankName = model.BankName ?? detail.BankName;
            detail.BankAccountNumber = model.BankAccountNumber ?? detail.BankAccountNumber;
            detail.BankBranch = model.BankBranch ?? detail.BankBranch;
            detail.BankAccountType = model.BankAccountType ?? detail.BankAccountType;
            detail.PanNumber = model.PanNumber ?? detail.PanNumber;

            // Occupation
            detail.Occupation = model.Occupation ?? detail.Occupation;
            detail.OrganizationName = model.OrganizationName ?? detail.OrganizationName;
            detail.AnnualIncome = model.AnnualIncome ?? detail.AnnualIncome;

            // PEP & Status
            detail.IsPep = model.IsPep ?? detail.IsPep;
            detail.PepRelation = model.PepRelation ?? detail.PepRelation;
            detail.HasCriminalRecord = model.HasCriminalRecord ?? detail.HasCriminalRecord;

            detail.UpdatedAt = DateTime.UtcNow;

            // IMPORTANT: Explicitly mark the entity as modified to ensure EF tracks changes
            _context.Entry(detail).State = EntityState.Modified;

            try
            {
                var changesSaved = await _context.SaveChangesAsync();

                // Log an audit entry for the KYC edit
                var auditLog = new KycApprovalLog
                {
                    KycWorkflowId = workflow.Id,
                    KycSessionId = workflow.KycSessionId,
                    UserId = userId,
                    Action = "KycDetailsEdited",
                    Remarks = "KYC details were updated by reviewer.",
                    ActionedByRoleId = workflow.CurrentRoleId,
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    UserAgent = Request.Headers.ContainsKey("User-Agent")
                        ? Request.Headers["User-Agent"].ToString()
                        : null,
                    CreatedAt = DateTime.UtcNow
                };
                _context.KycApprovalLogs.Add(auditLog);
                await _context.SaveChangesAsync();

                return Success(new
                {
                    message = "KYC details updated successfully.",
                    recordsUpdated = changesSaved,
                    updatedAt = detail.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                var errorMessage = $"Failed to save changes: {ex.Message}";
                if (ex.InnerException != null)
                {
                    errorMessage += $" | Inner: {ex.InnerException.Message}";
                }

                return Failure(errorMessage);
            }
        }

        public class KycUpdateModel
        {
            public int WorkflowId { get; set; }
            public string? FirstName { get; set; }
            public string? MiddleName { get; set; }
            public string? LastName { get; set; }
            public string? MobileNumber { get; set; }
            public string? Gender { get; set; }
            public DateTime? DateOfBirth { get; set; }
            public string? Nationality { get; set; }
            public string? MaritalStatus { get; set; }
            public string? CitizenshipNumber { get; set; }
            public string? CitizenshipIssuedDistrict { get; set; }
            public DateTime? CitizenshipIssuedDate { get; set; }

            public string? PermanentState { get; set; }
            public string? PermanentDistrict { get; set; }
            public string? PermanentMunicipality { get; set; }
            public int? PermanentWardNo { get; set; }
            public string? PermanentStreet { get; set; }

            public string? CurrentState { get; set; }
            public string? CurrentDistrict { get; set; }
            public string? CurrentMunicipality { get; set; }
            public int? CurrentWardNo { get; set; }
            public string? CurrentStreet { get; set; }

            public string? FatherName { get; set; }
            public string? MotherName { get; set; }
            public string? GrandFatherName { get; set; }
            public string? SpouseName { get; set; }

            public string? BankName { get; set; }
            public string? BankAccountNumber { get; set; }
            public string? BankBranch { get; set; }
            public string? BankAccountType { get; set; }
            public string? PanNumber { get; set; }

            public string? Occupation { get; set; }
            public string? OrganizationName { get; set; }
            public string? AnnualIncome { get; set; }

            public bool? IsPep { get; set; }
            public string? PepRelation { get; set; }
            public bool? HasCriminalRecord { get; set; }
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


        //download 
        [HttpGet("export-csv/{workflowId}")]
        [Authorize(Policy = Permissions.Kyc.Workflow)]
        public async Task<IActionResult> ExportKycCsv(int workflowId)
        {
            var workflow = await _context.KycWorkflowMasters
                .Include(w => w.KycSession!)
                .ThenInclude(s => s.KycDetail!)
                .FirstOrDefaultAsync(w => w.Id == workflowId);

            if (workflow == null || workflow.KycSession?.KycDetail == null)
                return NotFound("KYC record not found.");

            var details = workflow.KycSession.KycDetail;
            var sb = new StringBuilder();

            // Headers
            sb.AppendLine("Field Name,Value");

            // Personal Info
            sb.AppendLine($"Full Name,\"{details.FirstName} {details.MiddleName} {details.LastName}\"");
            sb.AppendLine($"Email,\"{details.Email}\"");
            sb.AppendLine($"Mobile,\"{details.MobileNumber}\"");
            sb.AppendLine($"DOB,\"{details.DateOfBirth?.ToString("yyyy-MM-dd")}\"");
            sb.AppendLine($"Gender,\"{details.Gender}\"");
            sb.AppendLine($"Nationality,\"{details.Nationality}\"");
            sb.AppendLine($"Marital Status,\"{details.MaritalStatus}\"");

            // Address
            sb.AppendLine(
                $"Permanent Address,\"{details.PermanentStreet}, {details.PermanentMunicipality}, {details.PermanentDistrict}, {details.PermanentState}\"");
            sb.AppendLine(
                $"Current Address,\"{details.CurrentStreet}, {details.CurrentMunicipality}, {details.CurrentDistrict}, {details.CurrentState}\"");

            // Family
            sb.AppendLine($"Father's Name,\"{details.FatherName}\"");
            sb.AppendLine($"Mother's Name,\"{details.MotherName}\"");
            sb.AppendLine($"Grandfather's Name,\"{details.GrandFatherName}\"");
            sb.AppendLine($"Spouse's Name,\"{details.SpouseName}\"");

            // IDs
            sb.AppendLine($"Citizenship Number,\"{details.CitizenshipNumber}\"");
            sb.AppendLine($"Citizenship Issued District,\"{details.CitizenshipIssuedDistrict}\"");
            sb.AppendLine($"Citizenship Issued Date,\"{details.CitizenshipIssuedDate?.ToString("yyyy-MM-dd")}\"");
            sb.AppendLine($"PAN Number,\"{details.PanNumber}\"");

            // Occupation
            sb.AppendLine($"Occupation,\"{details.Occupation}\"");
            sb.AppendLine($"Organization,\"{details.OrganizationName}\"");
            sb.AppendLine($"Designation,\"{details.Designation}\"");
            sb.AppendLine($"Annual Income,\"{details.AnnualIncome}\"");

            // Bank
            sb.AppendLine($"Bank Name,\"{details.BankName}\"");
            sb.AppendLine($"Account Number,\"{details.BankAccountNumber}\"");
            sb.AppendLine($"Branch,\"{details.BankBranch}\"");

            var fileName = $"KYC_Form_{details.FirstName}_{details.LastName}_{DateTime.Now:yyyyMMdd}.csv";
            return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", fileName);
        }


        //download pending list
        [HttpGet("export-pending-csv")]
        [Authorize(Policy = Permissions.Kyc.Workflow)]
        public async Task<IActionResult> ExportPendingCsv()
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return Failure("User not found.");

            var roles = await _userManager.GetRolesAsync(user);
            var isGlobal = roles.Any(r => r == "SuperAdmin" || r == "Admin");

            var query = _context.KycWorkflowMasters.AsQueryable();

            if (!isGlobal)
            {
                if (user.BranchId.HasValue)
                {
                    var bid = user.BranchId.Value;
                    query = query.Where(w => w.BranchId == bid || w.BranchId == null);
                }
                else
                {
                    query = query.Where(w => w.BranchId == null);
                }
            }

            var list = await query
                .Include(w => w.KycSession!)
                .ThenInclude(s => s.KycDetail!)
                .Where(w => w.Status == KycWorkflowStatus.InReview)
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("WorkflowID,Applicant Name,Email,Mobile,Citizenship,Status,Submitted At,Branch");

            foreach (var item in list)
            {
                var d = item.KycSession?.KycDetail;
                if (d == null) continue;

                sb.AppendLine(
                    $"{item.Id},\"{d.FirstName} {d.LastName}\",\"{d.Email}\",\"{d.MobileNumber}\",\"{d.CitizenshipNumber}\",\"{item.Status}\",\"{item.CreatedAt:yyyy-MM-dd HH:mm}\",\"{item.Branch?.Name ?? "Global"}\"");
            }

            var fileName = $"Pending_KYC_List_{DateTime.Now:yyyyMMdd}.csv";
            return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", fileName);
        }

        public class ApprovalModel
        {
            public int WorkflowId { get; set; }
            public string Remarks { get; set; } = string.Empty;
            public bool ReturnToPrevious { get; set; }
        }
    }
}
