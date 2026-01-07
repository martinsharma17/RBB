using AUTHApi.Data;
using AUTHApi.DTOs;
using AUTHApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Threading.Tasks;

namespace AUTHApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectSettingsController : BaseApiController
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public ProjectSettingsController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _context.ProjectSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                return Success(new ProjectSettingsDto
                {
                    ApplicationName = "Identity System",
                    LogoUrl = null
                });
            }

            var baseUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}";

            return Success(new ProjectSettingsDto
            {
                ApplicationName = settings.ApplicationName,
                LogoUrl = string.IsNullOrEmpty(settings.LogoPath)
                    ? null
                    : $"{baseUrl}/{settings.LogoPath.Replace("\\", "/").TrimStart('/')}"
            });
        }

        [Authorize(Roles = "SuperAdmin")]
        [HttpPost("update")]
        public async Task<IActionResult> UpdateSettings([FromForm] UpdateProjectSettingsDto dto)
        {
            try
            {
                var settings = await _context.ProjectSettings.FirstOrDefaultAsync();
                if (settings == null)
                {
                    settings = new ProjectSetting { ApplicationName = dto.ApplicationName };
                    _context.ProjectSettings.Add(settings);
                }
                else
                {
                    settings.ApplicationName = dto.ApplicationName;
                }

                if (dto.Logo != null && dto.Logo.Length > 0)
                {
                    // Ensure wwwroot exists
                    if (string.IsNullOrEmpty(_environment.WebRootPath))
                    {
                        // Fallback if WebRootPath is null (common in some environments)
                        var contentRoot = _environment.ContentRootPath;
                        var manualWebRoot = Path.Combine(contentRoot, "wwwroot");
                        if (!Directory.Exists(manualWebRoot)) Directory.CreateDirectory(manualWebRoot);
                        // We'll proceed with manualWebRoot
                    }

                    var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
                    var uploadsFolder = Path.Combine(webRoot, "uploads", "logos");

                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }

                    // Delete old logo if exists
                    if (!string.IsNullOrEmpty(settings.LogoPath))
                    {
                        var oldFilePath = Path.Combine(webRoot, settings.LogoPath.TrimStart('/').Replace("/", "\\"));
                        try
                        {
                            if (System.IO.File.Exists(oldFilePath))
                            {
                                System.IO.File.Delete(oldFilePath);
                            }
                        }
                        catch (Exception ex)
                        {
                            // Log and ignore deletion errors to prevent blocking update
                            Console.WriteLine($"Failed to delete old logo: {ex.Message}");
                        }
                    }

                    // Save new logo
                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.Logo.FileName);
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await dto.Logo.CopyToAsync(stream);
                    }

                    settings.LogoPath = $"uploads/logos/{fileName}";
                }

                settings.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Success("Project settings updated successfully");
            }
            catch (Exception ex)
            {
                return Failure($"Failed to update settings: {ex.Message}", 500,
                    _environment.IsDevelopment() ? ex.StackTrace : null);
            }
        }
    }
}
