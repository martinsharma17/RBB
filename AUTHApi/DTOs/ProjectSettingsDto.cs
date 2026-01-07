using Microsoft.AspNetCore.Http;

namespace AUTHApi.DTOs
{
    public class ProjectSettingsDto
    {
        public required string ApplicationName { get; set; }
        public string? LogoUrl { get; set; }
    }

    public class UpdateProjectSettingsDto
    {
        public required string ApplicationName { get; set; }
        public IFormFile? Logo { get; set; }
    }
}
