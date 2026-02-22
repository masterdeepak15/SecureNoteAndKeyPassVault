using Microsoft.EntityFrameworkCore;
using SecureNotesAPI.Application.Interfaces;
using SecureNotesAPI.Domain.Entities;
using SecureNotesAPI.Infrastructure.Data;

namespace SecureNotesAPI.Infrastructure.Services;

public class RsaSessionService : IRsaSessionService
{
    private readonly ApplicationDbContext _context;
    private readonly IRsaEncryptionService _rsaEncryptionService;
    private readonly IConfiguration _configuration;

    public RsaSessionService(
        ApplicationDbContext context,
        IRsaEncryptionService rsaEncryptionService,
        IConfiguration configuration)
    {
        _context = context;
        _rsaEncryptionService = rsaEncryptionService;
        _configuration = configuration;
    }

    public async Task<RsaKeySession> InitiateSessionAsync(string userId)
    {
        // Invalidate any existing active sessions for this user
        var existingSessions = await _context.RsaKeySessions
            .Where(s => s.UserId == userId && s.IsActive)
            .ToListAsync();

        foreach (var session in existingSessions)
        {
            session.IsActive = false;
        }

        // Generate new RSA key pair for this session
        var (publicKey, privateKey) = _rsaEncryptionService.GenerateKeyPair(2048);

        // In production, encrypt the private key with a master key
        // For now, we'll store it as-is (you should implement proper key management)
        var encryptedPrivateKey = Convert.ToBase64String(
            System.Text.Encoding.UTF8.GetBytes(privateKey));

        var newSession = new RsaKeySession
        {
            SessionId = Guid.NewGuid(),
            UserId = userId,
            ServerPublicKey = publicKey,
            EncryptedServerPrivateKey = encryptedPrivateKey,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24), // 24-hour session
            IsActive = true
        };

        _context.RsaKeySessions.Add(newSession);
        await _context.SaveChangesAsync();

        return newSession;
    }

    public async Task<bool> CompleteHandshakeAsync(Guid sessionId, string clientPublicKey)
    {
        var session = await _context.RsaKeySessions
            .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.IsActive);

        if (session == null || session.ExpiresAt < DateTime.UtcNow)
        {
            return false;
        }

        // Store client's public key
        session.ClientPublicKey = clientPublicKey;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<RsaKeySession?> GetActiveSessionAsync(string userId, Guid sessionId)
    {
        return await _context.RsaKeySessions
            .FirstOrDefaultAsync(s => 
                s.SessionId == sessionId && 
                s.UserId == userId && 
                s.IsActive && 
                s.ExpiresAt > DateTime.UtcNow);
    }

    public async Task InvalidateSessionAsync(Guid sessionId)
    {
        var session = await _context.RsaKeySessions
            .FirstOrDefaultAsync(s => s.SessionId == sessionId);

        if (session != null)
        {
            session.IsActive = false;
            await _context.SaveChangesAsync();
        }
    }

    public async Task CleanupExpiredSessionsAsync()
    {
        var expiredSessions = await _context.RsaKeySessions
            .Where(s => s.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

        _context.RsaKeySessions.RemoveRange(expiredSessions);
        await _context.SaveChangesAsync();
    }
}
