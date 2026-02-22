using System.ComponentModel.DataAnnotations;

namespace SecureNotesAPI.Domain.Entities;

/// <summary>
/// Stores server's private key for each session with a client
/// </summary>
public class RsaKeySession
{
    [Key]
    public Guid SessionId { get; set; }
    
    public string UserId { get; set; } = string.Empty;
    
    /// <summary>
    /// Server's RSA public key in XML format
    /// </summary>
    public string ServerPublicKey { get; set; } = string.Empty;
    
    /// <summary>
    /// Server's RSA private key in XML format (encrypted with master key)
    /// </summary>
    public string EncryptedServerPrivateKey { get; set; } = string.Empty;
    
    /// <summary>
    /// Client's RSA public key in XML format (received during handshake)
    /// </summary>
    public string? ClientPublicKey { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime ExpiresAt { get; set; }
    
    public bool IsActive { get; set; }
}
