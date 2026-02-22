namespace SecureNotesAPI.Application.DTOs;

public class PasswordEntryDto
{
    public Guid Id { get; set; }
    public string EncryptedSiteName { get; set; } = string.Empty;
    public string EncryptedUsername { get; set; } = string.Empty;
    public string EncryptedPassword { get; set; } = string.Empty;
    public string EncryptedUrl { get; set; } = string.Empty;
    public string? EncryptedServerIp { get; set; }
    public string? EncryptedHostname { get; set; }
    public string? EncryptedNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreatePasswordEntryDto
{
    public string EncryptedSiteName { get; set; } = string.Empty;
    public string EncryptedUsername { get; set; } = string.Empty;
    public string EncryptedPassword { get; set; } = string.Empty;
    public string EncryptedUrl { get; set; } = string.Empty;
    public string? EncryptedServerIp { get; set; }
    public string? EncryptedHostname { get; set; }
    public string? EncryptedNotes { get; set; }
}

public class UpdatePasswordEntryDto
{
    public string EncryptedSiteName { get; set; } = string.Empty;
    public string EncryptedUsername { get; set; } = string.Empty;
    public string EncryptedPassword { get; set; } = string.Empty;
    public string EncryptedUrl { get; set; } = string.Empty;
    public string? EncryptedServerIp { get; set; }
    public string? EncryptedHostname { get; set; }
    public string? EncryptedNotes { get; set; }
}
