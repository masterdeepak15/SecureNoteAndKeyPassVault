using SecureNotesAPI.Domain.Entities;

namespace SecureNotesAPI.Application.Interfaces;

public interface IRsaSessionService
{
    /// <summary>
    /// Initiates a new RSA key exchange session
    /// </summary>
    Task<RsaKeySession> InitiateSessionAsync(string userId);
    
    /// <summary>
    /// Completes the handshake by storing client's public key
    /// </summary>
    Task<bool> CompleteHandshakeAsync(Guid sessionId, string clientPublicKey);
    
    /// <summary>
    /// Gets an active session for the user
    /// </summary>
    Task<RsaKeySession?> GetActiveSessionAsync(string userId, Guid sessionId);
    
    /// <summary>
    /// Invalidates a session
    /// </summary>
    Task InvalidateSessionAsync(Guid sessionId);
    
    /// <summary>
    /// Cleans up expired sessions
    /// </summary>
    Task CleanupExpiredSessionsAsync();
}
