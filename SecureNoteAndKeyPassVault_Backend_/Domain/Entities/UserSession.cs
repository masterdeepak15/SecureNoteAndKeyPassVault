using System.ComponentModel.DataAnnotations;

namespace SecureNotesAPI.Domain.Entities;

/// <summary>
/// Tracks user login sessions across multiple devices/browsers
/// Enables users to view and manage all their active sessions
/// </summary>
public class UserSession
{
    [Key]
    public Guid SessionId { get; set; }
    
    public string UserId { get; set; } = string.Empty;
    
    /// <summary>
    /// JWT token identifier (JTI claim)
    /// </summary>
    public string TokenId { get; set; } = string.Empty;
    
    /// <summary>
    /// IP address of the device
    /// </summary>
    public string IpAddress { get; set; } = string.Empty;
    
    /// <summary>
    /// Browser information from User-Agent
    /// </summary>
    public string Browser { get; set; } = string.Empty;
    
    /// <summary>
    /// Operating System from User-Agent
    /// </summary>
    public string OperatingSystem { get; set; } = string.Empty;
    
    /// <summary>
    /// Device type (Desktop, Mobile, Tablet)
    /// </summary>
    public string DeviceType { get; set; } = string.Empty;
    
    /// <summary>
    /// Full User-Agent string
    /// </summary>
    public string UserAgent { get; set; } = string.Empty;
    
    /// <summary>
    /// Country/City based on IP (if available)
    /// </summary>
    public string? Location { get; set; }
    
    /// <summary>
    /// When the session was created
    /// </summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// Last activity timestamp (updated by heartbeat)
    /// </summary>
    public DateTime LastActivityAt { get; set; }
    
    /// <summary>
    /// When the token expires
    /// </summary>
    public DateTime ExpiresAt { get; set; }
    
    /// <summary>
    /// Whether this is the current session
    /// </summary>
    public bool IsCurrentSession { get; set; }
    
    /// <summary>
    /// Session is valid and not revoked
    /// </summary>
    public bool IsActive { get; set; }
    
    /// <summary>
    /// Session was explicitly logged out
    /// </summary>
    public bool IsRevoked { get; set; }
    
    /// <summary>
    /// When the session was revoked (if applicable)
    /// </summary>
    public DateTime? RevokedAt { get; set; }
}
