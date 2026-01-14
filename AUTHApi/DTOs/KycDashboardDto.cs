using System;
using System.Collections.Generic;

namespace AUTHApi.DTOs
{
    public class KycDashboardDto
    {
        public int TotalSubmitted { get; set; }
        public int PendingApproval { get; set; }
        public int Approved { get; set; }
        public int Rejected { get; set; }
        public int ResubmissionRequired { get; set; }
        
        public List<KycStatusCountDto> StatusDistribution { get; set; } = new();
        public List<KycTrendDto> DailyTrend { get; set; } = new();
    }

    public class KycStatusCountDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class KycTrendDto
    {
        public string Date { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
