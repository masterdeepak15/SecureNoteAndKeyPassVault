using System.ComponentModel.DataAnnotations;

namespace SecureNotesAPI.Domain.Entities;

public class PasswordEntry
{
    [Key]
    public Guid Id { get; set; }
    
    public string UserId { get; set; } = string.Empty;
    
    /// <summary>
    /// Encrypted site name (Base64 encoded)
    /// </summary>
    public string EncryptedSiteName { get; set; } = string.Empty;
    
    /// <summary>
    /// Encrypted username/email (Base64 encoded)
    /// </summary>
    public string EncryptedUsername { get; set; } = string.Empty;
    
    /// <summary>
    /// Encrypted password (Base64 encoded)
    /// </summary>
    public string EncryptedPassword { get; set; } = string.Empty;
    
    /// <summary>
    /// Encrypted URL (Base64 encoded)
    /// </summary>
    public string EncryptedUrl { get; set; } = string.Empty;
    
    /// <summary>
    /// Encrypted server IP (Base64 encoded)
    /// </summary>
    public string? EncryptedServerIp { get; set; }
    
    /// <summary>
    /// Encrypted hostname (Base64 encoded)
    /// </summary>
    public string? EncryptedHostname { get; set; }
    
    /// <summary>
    /// Encrypted notes/additional info (Base64 encoded)
    /// </summary>
    public string? EncryptedNotes { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime UpdatedAt { get; set; }
    
    public bool IsDeleted { get; set; }
}
