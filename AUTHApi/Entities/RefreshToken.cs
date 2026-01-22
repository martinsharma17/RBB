using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AUTHApi.Entities
{
    /// <summary>
    /// Represents a refresh token used to obtain new access tokens.
    /// This enhances security by allowing short-lived access tokens (10 mins)
    /// while maintaining a persistent session for the user.
    /// </summary>
    public class RefreshToken
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// The actual cryptic token string.
        /// </summary>
        [Required]
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// Expiry date for this refresh token (usually 7 days).
        /// </summary>
        public DateTime Expires { get; set; }

        /// <summary>
        /// When the token was created.
        /// </summary>
        public DateTime Created { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// IP address that requested this token.
        /// </summary>
        public string CreatedByIp { get; set; } = string.Empty;

        /// <summary>
        /// If the token has been revoked (on logout or security breach).
        /// </summary>
        public DateTime? Revoked { get; set; }

        /// <summary>
        /// IP address that revoked this token.
        /// </summary>
        public string? RevokedByIp { get; set; }

        /// <summary>
        /// If this token was replaced by a new one (Token Rotation).
        /// </summary>
        public string? ReplacedByToken { get; set; }

        /// <summary>
        /// Reason for revocation.
        /// </summary>
        public string? ReasonRevoked { get; set; }

        /// <summary>
        /// Computed property to check if token is expired.
        /// </summary>
        public bool IsExpired => DateTime.UtcNow >= Expires;

        /// <summary>
        /// Computed property to check if token is revoked.
        /// </summary>
        public bool IsRevoked => Revoked != null;

        /// <summary>
        /// Computed property to check if token is still valid.
        /// </summary>
        public bool IsActive => !IsRevoked && !IsExpired;

        [Required]
        public string UserId { get; set; } = string.Empty;

        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }
    }
}
