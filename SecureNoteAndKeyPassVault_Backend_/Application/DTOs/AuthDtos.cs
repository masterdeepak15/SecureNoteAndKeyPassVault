namespace SecureNotesAPI.Application.DTOs;

public class RegisterDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
}

public class InitiateHandshakeResponse
{
    public Guid SessionId { get; set; }
    public string ServerPublicKey { get; set; } = string.Empty;
}

public class CompleteHandshakeRequest
{
    public Guid SessionId { get; set; }
    public string ClientPublicKey { get; set; } = string.Empty;
}
