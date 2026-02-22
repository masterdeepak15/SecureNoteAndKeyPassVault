namespace SecureNotesAPI.Application.DTOs;

public class GoogleLoginDto
{
    public string IdToken { get; set; } = string.Empty;
}

public class GoogleAuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
    public HandshakeData Handshake { get; set; } = new();
    public bool IsNewUser { get; set; }
}

public class HandshakeData
{
    public Guid SessionId { get; set; }
    public string ServerPublicKey { get; set; } = string.Empty;
}
