using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace AUTHApi.Controllers
{
    /// <summary>
    /// Base controller that encapsulates common logic and standardized responses.
    /// All API controllers should inherit from this.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public abstract class BaseApiController : ControllerBase
    {
        /// <summary>
        /// Gets the current authenticated User ID from the claims.
        /// Returns null if user is not authenticated.
        /// </summary>
        protected string? CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        /// <summary>
        /// Gets the current authenticated User Email from the claims.
        /// </summary>
        protected string? CurrentUserEmail => User.FindFirst(ClaimTypes.Email)?.Value;

        /// <summary>
        /// Gets the full ApplicationUser object attached by the JwtMiddleware.
        /// Returns null if not found or user not authenticated.
        /// </summary>
        protected AUTHApi.Entities.ApplicationUser? CurrentUser =>
            HttpContext.Items["User"] as AUTHApi.Entities.ApplicationUser;

        /// <summary>
        /// Returns a standardized success response.
        /// </summary>
        /// <typeparam name="T">Type of the data</typeparam>
        /// <param name="data">The payload to return</param>
        /// <param name="message">Optional success message</param>
        protected IActionResult Success<T>(T data, string message = "Request successful")
        {
            return Ok(new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data
            });
        }

        /// <summary>
        /// Returns a standardized success response without data.
        /// </summary>
        /// <param name="message">Success message</param>
        protected IActionResult Success(string message = "Request successful")
        {
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = message,
                Data = null
            });
        }

        /// <summary>
        /// Returns a standardized error response.
        /// </summary>
        /// <param name="message">Error message</param>
        /// <param name="statusCode">HTTP status code (default 400)</param>
        /// <param name="errors">Optional list of validation errors</param>
        protected IActionResult Failure(string message, int statusCode = 400, object? errors = null)
        {
            var response = new ApiResponse<object>
            {
                Success = false,
                Message = message,
                Errors = errors
            };

            return StatusCode(statusCode, response);
        }

        /// <summary>
        /// Returns a standardized paged response.
        /// </summary>
        protected IActionResult PagedSuccess<T>(List<T> data, int totalCount, int page, int pageSize,
            string message = "Request successful")
        {
            return Ok(new PagedApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }

        /// <summary>
        /// Returns a standardized internal server error response.
        /// </summary>
        /// <param name="message">Error message</param>
        protected IActionResult InternalServerError(string message)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = message,
                Errors = null
            });
        }
    }

    // --- Response Wrappers ---

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public object? Errors { get; set; }
    }

    public class PagedApiResponse<T> : ApiResponse<List<T>>
    {
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
