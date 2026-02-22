using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecureNotesAPI.Application.DTOs;
using SecureNotesAPI.Application.Interfaces;
using System.Security.Claims;

namespace SecureNotesAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SessionsController : ControllerBase
{
    private readonly ISessionService _sessionService;

    public SessionsController(ISessionService sessionService)
    {
        _sessionService = sessionService;
    }

    /// <summary>
    /// Get all active sessions for the current user
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetActiveSessions()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Get current session ID from claims
        var sessionIdClaim = User.FindFirstValue("SessionId");
        var currentSessionId = Guid.TryParse(sessionIdClaim, out var sessionId) 
            ? sessionId 
            : Guid.Empty;

        var sessions = await _sessionService.GetActiveSessionsAsync(userId, currentSessionId);

        return Ok(new SessionsResponse
        {
            ActiveSessions = sessions,
            TotalSessions = sessions.Count,
            CurrentSessionId = currentSessionId
        });
    }

    /// <summary>
    /// Heartbeat endpoint - keeps session alive and validates token
    /// Client should call this every 2-5 minutes
    /// </summary>
    [HttpPost("heartbeat")]
    public async Task<IActionResult> Heartbeat([FromBody] HeartbeatRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var response = await _sessionService.UpdateActivityAsync(request.SessionId, userId);

        if (!response.IsValid)
        {
            return Ok(new HeartbeatResponse
            {
                IsValid = false,
                LastActivityAt = response.LastActivityAt,
                ExpiresAt = response.ExpiresAt
            });
        }

        return Ok(response);
    }

    /// <summary>
    /// Revoke a specific session (logout from a device)
    /// </summary>
    [HttpDelete("{sessionId}")]
    public async Task<IActionResult> RevokeSession(Guid sessionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var success = await _sessionService.RevokeSessionAsync(sessionId, userId);

        if (!success)
        {
            return NotFound(new { message = "Session not found" });
        }

        return Ok(new { message = "Session revoked successfully" });
    }

    /// <summary>
    /// Logout from all other devices (keep current session active)
    /// </summary>
    [HttpPost("revoke-others")]
    public async Task<IActionResult> RevokeAllOtherSessions()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var sessionIdClaim = User.FindFirstValue("SessionId");
        var currentSessionId = Guid.TryParse(sessionIdClaim, out var sessionId) 
            ? sessionId 
            : Guid.Empty;

        if (currentSessionId == Guid.Empty)
        {
            return BadRequest(new { message = "Current session not found" });
        }

        var count = await _sessionService.RevokeAllOtherSessionsAsync(userId, currentSessionId);

        return Ok(new 
        { 
            message = $"Logged out from {count} other device(s)",
            revokedSessions = count
        });
    }

    /// <summary>
    /// Logout from ALL devices (including current)
    /// </summary>
    [HttpPost("revoke-all")]
    public async Task<IActionResult> RevokeAllSessions()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var count = await _sessionService.RevokeAllSessionsAsync(userId);

        return Ok(new 
        { 
            message = $"Logged out from all {count} device(s)",
            revokedSessions = count
        });
    }

    /// <summary>
    /// Validate if current session is still active
    /// </summary>
    [HttpGet("validate")]
    public async Task<IActionResult> ValidateSession()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var sessionIdClaim = User.FindFirstValue("SessionId");
        if (!Guid.TryParse(sessionIdClaim, out var sessionId))
        {
            return BadRequest(new { message = "Invalid session ID" });
        }

        var isValid = await _sessionService.IsSessionValidAsync(sessionId, userId);

        return Ok(new 
        { 
            isValid,
            sessionId,
            message = isValid ? "Session is valid" : "Session expired or revoked"
        });
    }
}
