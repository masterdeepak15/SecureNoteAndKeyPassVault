using SecureNotesAPI.Application.DTOs;
using SecureNotesAPI.Application.Interfaces;
using SecureNotesAPI.Domain.Entities;
using SecureNotesAPI.Infrastructure.Utils;

namespace SecureNotesAPI.Infrastructure.Services;

public class SessionService : ISessionService
{
    private readonly IRepository<UserSession> _sessionRepository;
    private readonly IConfiguration _configuration;
    
    // Session expires after 30 minutes of inactivity
    private readonly TimeSpan _inactivityTimeout = TimeSpan.FromMinutes(30);
    
    // Token expires after 12 hours (even with activity)
    private readonly TimeSpan _absoluteTimeout = TimeSpan.FromHours(12);

    public SessionService(
        IRepository<UserSession> sessionRepository,
        IConfiguration configuration)
    {
        _sessionRepository = sessionRepository;
        _configuration = configuration;
    }

    public async Task<UserSession> CreateSessionAsync(string userId, string tokenId, string ipAddress, string userAgent)
    {
        var (browser, os, deviceType) = UserAgentParser.Parse(userAgent);
        
        var session = new UserSession
        {
            SessionId = Guid.NewGuid(),
            UserId = userId,
            TokenId = tokenId,
            IpAddress = ipAddress,
            Browser = browser,
            OperatingSystem = os,
            DeviceType = deviceType,
            UserAgent = userAgent,
            Location = null, // Can be enhanced with GeoIP lookup
            CreatedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.Add(_absoluteTimeout),
            IsCurrentSession = true,
            IsActive = true,
            IsRevoked = false
        };

        await _sessionRepository.AddAsync(session);
        await _sessionRepository.SaveChangesAsync();

        return session;
    }

    public async Task<HeartbeatResponse> UpdateActivityAsync(Guid sessionId, string userId)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);
        
        if (session == null || session.UserId != userId)
        {
            return new HeartbeatResponse
            {
                IsValid = false,
                LastActivityAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow
            };
        }

        // Check if session is still valid
        var now = DateTime.UtcNow;
        var timeSinceActivity = now - session.LastActivityAt;
        
        // Session expired due to inactivity
        if (timeSinceActivity > _inactivityTimeout)
        {
            session.IsActive = false;
            session.IsRevoked = true;
            session.RevokedAt = now;
            await _sessionRepository.UpdateAsync(session);
            await _sessionRepository.SaveChangesAsync();
            
            return new HeartbeatResponse
            {
                IsValid = false,
                LastActivityAt = session.LastActivityAt,
                ExpiresAt = session.ExpiresAt
            };
        }

        // Session expired (absolute timeout)
        if (now > session.ExpiresAt)
        {
            session.IsActive = false;
            await _sessionRepository.UpdateAsync(session);
            await _sessionRepository.SaveChangesAsync();
            
            return new HeartbeatResponse
            {
                IsValid = false,
                LastActivityAt = session.LastActivityAt,
                ExpiresAt = session.ExpiresAt
            };
        }

        // Session is revoked
        if (session.IsRevoked || !session.IsActive)
        {
            return new HeartbeatResponse
            {
                IsValid = false,
                LastActivityAt = session.LastActivityAt,
                ExpiresAt = session.ExpiresAt
            };
        }

        // Update activity timestamp
        session.LastActivityAt = now;
        await _sessionRepository.UpdateAsync(session);
        await _sessionRepository.SaveChangesAsync();

        return new HeartbeatResponse
        {
            IsValid = true,
            LastActivityAt = session.LastActivityAt,
            ExpiresAt = session.ExpiresAt,
            NewToken = null // Token refresh can be implemented if needed
        };
    }

    public async Task<List<UserSessionDto>> GetActiveSessionsAsync(string userId, Guid currentSessionId)
    {
        var sessions = await _sessionRepository.FindAsync(s => 
            s.UserId == userId && 
            s.IsActive && 
            !s.IsRevoked &&
            s.ExpiresAt > DateTime.UtcNow);

        return sessions.Select(s => new UserSessionDto
        {
            SessionId = s.SessionId,
            IpAddress = s.IpAddress,
            Browser = s.Browser,
            OperatingSystem = s.OperatingSystem,
            DeviceType = s.DeviceType,
            Location = s.Location,
            CreatedAt = s.CreatedAt,
            LastActivityAt = s.LastActivityAt,
            ExpiresAt = s.ExpiresAt,
            IsCurrentSession = s.SessionId == currentSessionId
        })
        .OrderByDescending(s => s.LastActivityAt)
        .ToList();
    }

    public async Task<bool> RevokeSessionAsync(Guid sessionId, string userId)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);
        
        if (session == null || session.UserId != userId)
            return false;

        session.IsRevoked = true;
        session.IsActive = false;
        session.RevokedAt = DateTime.UtcNow;

        await _sessionRepository.UpdateAsync(session);
        await _sessionRepository.SaveChangesAsync();

        return true;
    }

    public async Task<int> RevokeAllOtherSessionsAsync(string userId, Guid currentSessionId)
    {
        var sessions = await _sessionRepository.FindAsync(s => 
            s.UserId == userId && 
            s.SessionId != currentSessionId &&
            s.IsActive &&
            !s.IsRevoked);

        var count = 0;
        var now = DateTime.UtcNow;

        foreach (var session in sessions)
        {
            session.IsRevoked = true;
            session.IsActive = false;
            session.RevokedAt = now;
            await _sessionRepository.UpdateAsync(session);
            count++;
        }

        await _sessionRepository.SaveChangesAsync();
        return count;
    }

    public async Task<int> RevokeAllSessionsAsync(string userId)
    {
        var sessions = await _sessionRepository.FindAsync(s => 
            s.UserId == userId && 
            s.IsActive &&
            !s.IsRevoked);

        var count = 0;
        var now = DateTime.UtcNow;

        foreach (var session in sessions)
        {
            session.IsRevoked = true;
            session.IsActive = false;
            session.RevokedAt = now;
            await _sessionRepository.UpdateAsync(session);
            count++;
        }

        await _sessionRepository.SaveChangesAsync();
        return count;
    }

    public async Task<bool> IsSessionValidAsync(Guid sessionId, string userId)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);
        
        if (session == null || session.UserId != userId)
            return false;

        if (session.IsRevoked || !session.IsActive)
            return false;

        if (DateTime.UtcNow > session.ExpiresAt)
            return false;

        var timeSinceActivity = DateTime.UtcNow - session.LastActivityAt;
        if (timeSinceActivity > _inactivityTimeout)
            return false;

        return true;
    }

    public async Task<int> CleanupExpiredSessionsAsync()
    {
        var now = DateTime.UtcNow;
        
        // Find sessions that are expired or inactive
        var expiredSessions = await _sessionRepository.FindAsync(s => 
            s.IsActive &&
            (s.ExpiresAt < now || 
             (now - s.LastActivityAt) > _inactivityTimeout));

        var count = 0;

        foreach (var session in expiredSessions)
        {
            session.IsActive = false;
            if (!session.IsRevoked)
            {
                session.IsRevoked = true;
                session.RevokedAt = now;
            }
            await _sessionRepository.UpdateAsync(session);
            count++;
        }

        await _sessionRepository.SaveChangesAsync();
        return count;
    }

    public async Task<UserSession?> GetSessionByTokenIdAsync(string tokenId)
    {
        var sessions = await _sessionRepository.FindAsync(s => s.TokenId == tokenId);
        return sessions.FirstOrDefault();
    }
}
