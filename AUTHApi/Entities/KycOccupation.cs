using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    public class KycOccupation
    {
        [Key] public int Id { get; set; }

        public int? SessionId { get; set; }
        [ForeignKey("SessionId")] public virtual KycFormSession? Session { get; set; }

        public int? KycPersonalInfoId { get; set; }
        [ForeignKey("KycPersonalInfoId")] public virtual KycPersonalInfo? PersonalInfo { get; set; }

        /// <summary>
        /// 1=Service, 2=Expert, 3=Business, 4=Agriculture, 5=Retired, 6=HouseWife, 7=Student, 8=Others
        /// </summary>
        public byte? OccupationType { get; set; }

        [MaxLength(200)] public string? OtherOccupation { get; set; }

        /// <summary>
        /// 1=Govt, 2=Public, 3=Private, 4=NGO/INGO
        /// </summary>
        public byte? ServiceSector { get; set; }

        /// <summary>
        /// 1=Manufacturing, 2=Service, 3=Others
        /// </summary>
        public byte? BusinessType { get; set; }

        [MaxLength(300)] public string? OrganizationName { get; set; }

        [MaxLength(500)] public string? OrganizationAddress { get; set; }

        [MaxLength(200)] public string? Designation { get; set; }

        [MaxLength(50)] public string? EmployeeIdNo { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public DateTime? ModifiedDate { get; set; }
        public bool IsDraft { get; set; } = true;
    }
}
