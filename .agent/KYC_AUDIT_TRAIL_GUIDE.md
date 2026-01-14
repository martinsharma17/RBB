# 📋 KYC Audit Trail - User Guide

## Where to View the Complete Audit History

### 🎯 Accessing the Audit Trail

1. **Navigate to:** Dashboard → KYC Approval Queue (or KYC Workflow View)

2. **Select a KYC Application:** Click the "Review Data" button on any KYC application

3. **Open the Workflow History Tab:** In the modal that appears, click on the **"Workflow History"** tab (4th tab)

### 📊 What Information is Displayed

The audit trail shows a **complete timeline** of all actions performed on a KYC application:

#### Action Types Displayed:
- ✅ **APPROVED** (Green) - When a reviewer approves the application
- ❌ **REJECTED** (Red) - When a reviewer rejects the application
- ✏️ **EDITED** (Orange) - When a reviewer edits KYC details
- 🔵 **Submitted** (Blue) - When the application was initially submitted
- 🔄 **Resubmitted** (Blue) - When corrections were resubmitted
- ↩️ **Returned** (Blue) - When sent back to previous reviewer
- 🔙 **PullBack** (Blue) - When an application was pulled back

#### Information Shown for Each Event:

1. **Action Badge** - Color-coded badge showing the action type
2. **Timestamp** - Exact date and time of the action
3. **User Information:**
   - Full name of the person who performed the action
   - Their role (e.g., "Branch Manager", "Head Office", "Admin")
4. **Workflow Transition** (for approvals/rejections):
   - From which role
   - To which role
5. **Remarks/Feedback** - What the reviewer said about the action
6. **Security Information:**
   - IP Address from which the action was performed
   - Device/Browser information (User Agent)

### 🎨 Visual Indicators

- **Orange Badge with ✏️ Icon** = KYC Details Edited
- **Green Badge with ✓** = Approved
- **Red Badge** = Rejected
- **Blue Badge** = Other workflow actions

Edit events are highlighted with:
- Orange background
- Edit icon (pencil)
- Special "✏️ EDITED" label

### 📝 Example Timeline Entry

```
┌─────────────────────────────────────────────────────
│ ✏️ EDITED                    2026-01-12 21:34:40
│ By: John Doe (Branch Manager)
│ 
│ KYC details were updated by reviewer.
│ 
│ IP: 192.168.1.100    Device: Mozilla
└─────────────────────────────────────────────────────
```

### 💾 Database Storage

All audit logs are permanently stored in the `KycApprovalLogs` table with the following fields:

```sql
CREATE TABLE KycApprovalLogs (
    Id INT PRIMARY KEY,
    KycWorkflowId INT,
    KycSessionId INT,
    UserId NVARCHAR(450),
    Action NVARCHAR(50),         -- e.g., "KycDetailsEdited"
    Remarks NVARCHAR(MAX),
    ActionedByRoleId NVARCHAR(450),
    ForwardedToRoleId NVARCHAR(450),
    ClientIpAddress NVARCHAR(50),
    UserAgent NVARCHAR(500),
    CreatedAt DATETIME2
);
```

### 🔍 Filtering Audit Logs

Currently, all logs are displayed in reverse chronological order (newest first). You can:

1. Scroll through the timeline to see all historical events
2. Each event shows complete details including who, when, what, and from where
3. Edit events are visually distinct with orange highlighting

### 🛡️ Compliance & Security

The audit trail provides:
- ✅ **Complete traceability** - Every change is logged
- ✅ **Non-repudiation** - User identity and timestamp are recorded
- ✅ **IP tracking** - Know from where actions were performed
- ✅ **Device tracking** - Browser and device information
- ✅ **Immutable logs** - Once created, logs cannot be edited or deleted
- ✅ **Regulatory compliance** - Meets audit requirements for financial applications

### 📱 Access Levels

The Workflow History tab is visible to:
- ✅ Users with KYC.Workflow permission
- ✅ SuperAdmins and Admins (see all actions)
- ✅ Branch staff (see actions on their branch applications)
- ✅ Current workflow holders (reviewers)

### 🎯 Use Cases

1. **Compliance Audits** - Show regulators who approved/rejected applications
2. **Quality Control** - Track which reviewers are editing applications
3. **Dispute Resolution** - See exact timeline of all changes
4. **Training** - Review decision patterns and feedback quality
5. **Security Monitoring** - Detect unusual access patterns or IP addresses
