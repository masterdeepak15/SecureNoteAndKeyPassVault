using System.ComponentModel.DataAnnotations;

namespace SecureNotesAPI.Domain.Entities;

public class Note
{
    [Key]
    public Guid Id { get; set; }
    
    public string UserId { get; set; } = string.Empty;
    
    /// <summary>
    /// Encrypted title (Base64 encoded)
    /// </summary>
    public string EncryptedTitle { get; set; } = string.Empty;
    
    /// <summary>
    /// Encrypted content (Base64 encoded)
    /// </summary>
    public string EncryptedContent { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime UpdatedAt { get; set; }
    
    public bool IsDeleted { get; set; }
}
