namespace SecureNotesAPI.Application.DTOs;

public class UserSessionDto
{
    public Guid SessionId { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string Browser { get; set; } = string.Empty;
    public string OperatingSystem { get; set; } = string.Empty;
    public string DeviceType { get; set; } = string.Empty;
    public string? Location { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastActivityAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsCurrentSession { get; set; }
}

public class HeartbeatRequest
{
    public Guid SessionId { get; set; }
}

public class HeartbeatResponse
{
    public bool IsValid { get; set; }
    public DateTime LastActivityAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string? NewToken { get; set; }  // If token was refreshed
}

public class RevokeSessionRequest
{
    public Guid SessionId { get; set; }
}

public class SessionsResponse
{
    public List<UserSessionDto> ActiveSessions { get; set; } = new();
    public int TotalSessions { get; set; }
    public Guid CurrentSessionId { get; set; }
}
