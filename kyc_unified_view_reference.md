# Unified KYC View Reference

This document provides the implementation details for pulling a flattened view that joins KYC customer data with its current workflow state.

## 1. SQL View Script
Run this script in your database to create a permanent SQL View. This is perfect for custom reporting or high-performance Read-only operations.

```sql
CREATE VIEW vw_KycUnifiedView AS
SELECT 
    w.Id AS WorkflowId,
    d.Id AS KycId,
    -- Concatenate name fields
    (d.FirstName + ' ' + ISNULL(d.MiddleName + ' ', '') + d.LastName) AS CustomerName,
    d.Email,
    d.MobileNumber,
    -- Workflow state
    CASE w.Status 
        WHEN 1 THEN 'InProgress' 
        WHEN 2 THEN 'Approved' 
        WHEN 3 THEN 'Rejected' 
        WHEN 4 THEN 'ResubmissionRequired' 
        WHEN 5 THEN 'InReview' 
    END AS Status,
    w.PendingLevel,
    -- Join Role Names
    r_curr.Name AS CurrentRoleName,
    r_sub.Name AS SubmittedRoleName,
    w.FullChain,
    -- Audit details
    w.CreatedAt,
    w.UpdatedAt AS LastUpdatedAt,
    w.LastRemarks
FROM KycWorkflowMasters w
JOIN KycFormSessions s ON w.KycSessionId = s.Id
JOIN KycDetails d ON s.KycDetailId = d.Id
LEFT JOIN AspNetRoles r_curr ON w.CurrentRoleId = r_curr.Id
LEFT JOIN AspNetRoles r_sub ON w.SubmittedRoleId = r_sub.Id
```

## 2. C# / EF Core Helper
Use this query within your Controllers or Services to get the `KycUnifiedViewDto` list.

```csharp
public async Task<List<KycUnifiedViewDto>> GetUnifiedKycListViewAsync()
{
    return await _context.KycWorkflowMasters
        .Include(w => w.KycSession)
            .ThenInclude(s => s.KycDetail)
        .OrderByDescending(w => w.CreatedAt)
        .Select(w => new KycUnifiedViewDto
        {
            WorkflowId = w.Id,
            KycId = w.KycSession.KycDetail.Id,
            CustomerName = (w.KycSession.KycDetail.FirstName + " " + (w.KycSession.KycDetail.MiddleName ?? "") + " " + w.KycSession.KycDetail.LastName).Trim(),
            Email = w.KycSession.KycDetail.Email,
            MobileNumber = w.KycSession.KycDetail.MobileNumber,
            Status = w.Status.ToString(),
            PendingLevel = w.PendingLevel,
            // Efficiently fetch role names
            CurrentRoleName = _context.Roles
                .Where(r => r.Id == w.CurrentRoleId)
                .Select(r => r.Name)
                .FirstOrDefault(),
            SubmittedRoleName = _context.Roles
                .Where(r => r.Id == w.SubmittedRoleId)
                .Select(r => r.Name)
                .FirstOrDefault(),
            FullChain = w.FullChain,
            CreatedAt = w.CreatedAt,
            LastUpdatedAt = w.UpdatedAt,
            LastRemarks = w.LastRemarks
        })
        .ToListAsync();
}
```
