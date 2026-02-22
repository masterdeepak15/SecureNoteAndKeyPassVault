using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SecureNotesAPI.Application.DTOs;
using SecureNotesAPI.Application.Interfaces;
using SecureNotesAPI.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SecureNotesAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly IRsaSessionService _rsaSessionService;
    private readonly IRsaEncryptionService _rsaEncryptionService;
    private readonly IGoogleAuthService _googleAuthService;
    private readonly ISessionService _sessionService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration,
        IRsaSessionService rsaSessionService,
        IRsaEncryptionService rsaEncryptionService,
        IGoogleAuthService googleAuthService,
        ISessionService sessionService)
    {
        _userManager = userManager;
        _configuration = configuration;
        _rsaSessionService = rsaSessionService;
        _rsaEncryptionService = rsaEncryptionService;
        _googleAuthService = googleAuthService;
        _sessionService = sessionService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        if (registerDto.Password != registerDto.ConfirmPassword)
        {
            return BadRequest(new { message = "Passwords do not match" });
        }

        var userExists = await _userManager.FindByEmailAsync(registerDto.Email);
        if (userExists != null)
        {
            return BadRequest(new { message = "User already exists" });
        }

        var user = new ApplicationUser
        {
            Email = registerDto.Email,
            UserName = registerDto.Email,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, registerDto.Password);

        if (!result.Succeeded)
        {
            return BadRequest(new { 
                message = "User creation failed", 
                errors = result.Errors.Select(e => e.Description) 
            });
        }

        return Ok(new { message = "User created successfully" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        var user = await _userManager.FindByEmailAsync(loginDto.Email);
        
        if (user == null || !await _userManager.CheckPasswordAsync(user, loginDto.Password))
        {
            return Unauthorized(new { message = "Invalid credentials" });
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        // Generate session ID for tracking
        var sessionId = Guid.NewGuid();
        var tokenId = Guid.NewGuid().ToString();
        
        var token = GenerateJwtToken(user, sessionId, tokenId);
        
        // Create session with device info
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var userAgent = Request.Headers["User-Agent"].ToString();
        
        await _sessionService.CreateSessionAsync(user.Id, tokenId, ipAddress, userAgent);
        
        // AUTO-INITIATE HANDSHAKE on login
        var rsaSession = await _rsaSessionService.InitiateSessionAsync(user.Id);
        var serverPublicKeyPem = _rsaEncryptionService.ExportPublicKeyToPem(rsaSession.ServerPublicKey);
        
        return Ok(new 
        {
            token,
            email = user.Email!,
            sessionId,
            expiration = DateTime.UtcNow.AddHours(12),
            // Handshake data included in login response
            handshake = new 
            {
                sessionId = rsaSession.SessionId,
                serverPublicKey = serverPublicKeyPem
            }
        });
    }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto googleLoginDto)
    {
        // Validate Google ID token
        var payload = await _googleAuthService.ValidateGoogleTokenAsync(googleLoginDto.IdToken);
        
        if (payload == null)
        {
            return Unauthorized(new { message = "Invalid Google token" });
        }

        // Check if user exists
        var user = await _userManager.FindByEmailAsync(payload.Email);
        bool isNewUser = false;

        if (user == null)
        {
            // Create new user
            user = new ApplicationUser
            {
                Email = payload.Email,
                UserName = payload.Email,
                EmailConfirmed = true, // Google verifies email
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user);
            
            if (!result.Succeeded)
            {
                return BadRequest(new { 
                    message = "User creation failed", 
                    errors = result.Errors.Select(e => e.Description) 
                });
            }

            isNewUser = true;
        }

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        // Generate session ID for tracking
        var sessionId = Guid.NewGuid();
        var tokenId = Guid.NewGuid().ToString();
        
        // Generate JWT token
        var token = GenerateJwtToken(user, sessionId, tokenId);
        
        // Create session with device info
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var userAgent = Request.Headers["User-Agent"].ToString();
        
        await _sessionService.CreateSessionAsync(user.Id, tokenId, ipAddress, userAgent);
        
        // AUTO-INITIATE HANDSHAKE
        var rsaSession = await _rsaSessionService.InitiateSessionAsync(user.Id);
        var serverPublicKeyPem = _rsaEncryptionService.ExportPublicKeyToPem(rsaSession.ServerPublicKey);
        
        return Ok(new GoogleAuthResponseDto
        {
            Token = token,
            Email = user.Email!,
            Name = payload.Name ?? payload.Email,
            Expiration = DateTime.UtcNow.AddHours(12),
            Handshake = new HandshakeData
            {
                SessionId = rsaSession.SessionId,
                ServerPublicKey = serverPublicKeyPem
            },
            IsNewUser = isNewUser
        });
    }

    [Authorize]
    [HttpPost("handshake/initiate")]
    public async Task<IActionResult> InitiateHandshake()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var session = await _rsaSessionService.InitiateSessionAsync(userId);
        
        // Export public key to PEM format for client
        var publicKeyPem = _rsaEncryptionService.ExportPublicKeyToPem(session.ServerPublicKey);

        return Ok(new InitiateHandshakeResponse
        {
            SessionId = session.SessionId,
            ServerPublicKey = publicKeyPem
        });
    }

    [Authorize]
    [HttpPost("handshake/complete")]
    public async Task<IActionResult> CompleteHandshake([FromBody] CompleteHandshakeRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Convert PEM to XML format for storage
        var clientPublicKeyXml = _rsaEncryptionService.ImportPublicKeyFromPem(request.ClientPublicKey);
        
        var success = await _rsaSessionService.CompleteHandshakeAsync(
            request.SessionId, 
            clientPublicKeyXml);

        if (!success)
        {
            return BadRequest(new { message = "Invalid or expired session" });
        }

        return Ok(new { message = "Handshake completed successfully" });
    }

    [Authorize]
    [HttpPost("handshake/invalidate/{sessionId}")]
    public async Task<IActionResult> InvalidateSession(Guid sessionId)
    {
        await _rsaSessionService.InvalidateSessionAsync(sessionId);
        return Ok(new { message = "Session invalidated" });
    }

    private string GenerateJwtToken(ApplicationUser user, Guid sessionId, string tokenId)
    {
        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "YourSecretKeyHere_MinimumLength32Characters!"));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, tokenId),
            new Claim("SessionId", sessionId.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
