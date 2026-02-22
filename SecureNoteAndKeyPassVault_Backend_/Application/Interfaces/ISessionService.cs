using SecureNotesAPI.Application.DTOs;
using SecureNotesAPI.Domain.Entities;

namespace SecureNotesAPI.Application.Interfaces;

public interface ISessionService
{
    /// <summary>
    /// Creates a new session when user logs in
    /// </summary>
    Task<UserSession> CreateSessionAsync(string userId, string tokenId, string ipAddress, string userAgent);
    
    /// <summary>
    /// Updates session activity (called by heartbeat)
    /// </summary>
    Task<HeartbeatResponse> UpdateActivityAsync(Guid sessionId, string userId);
    
    /// <summary>
    /// Gets all active sessions for a user
    /// </summary>
    Task<List<UserSessionDto>> GetActiveSessionsAsync(string userId, Guid currentSessionId);
    
    /// <summary>
    /// Revokes a specific session (logout from device)
    /// </summary>
    Task<bool> RevokeSessionAsync(Guid sessionId, string userId);
    
    /// <summary>
    /// Revokes all sessions except current (logout from all other devices)
    /// </summary>
    Task<int> RevokeAllOtherSessionsAsync(string userId, Guid currentSessionId);
    
    /// <summary>
    /// Revokes all sessions (logout everywhere)
    /// </summary>
    Task<int> RevokeAllSessionsAsync(string userId);
    
    /// <summary>
    /// Validates if session is still active
    /// </summary>
    Task<bool> IsSessionValidAsync(Guid sessionId, string userId);
    
    /// <summary>
    /// Cleans up expired and inactive sessions
    /// </summary>
    Task<int> CleanupExpiredSessionsAsync();
    
    /// <summary>
    /// Gets session by token ID
    /// </summary>
    Task<UserSession?> GetSessionByTokenIdAsync(string tokenId);
}
