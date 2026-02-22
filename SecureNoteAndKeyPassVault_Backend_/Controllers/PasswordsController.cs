using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecureNotesAPI.Application.DTOs;
using SecureNotesAPI.Application.Interfaces;
using System.Security.Claims;

namespace SecureNotesAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PasswordsController : ControllerBase
{
    private readonly IPasswordService _passwordService;
    private readonly IRsaEncryptionService _rsaEncryption;
    private readonly IRsaSessionService _sessionService;

    public PasswordsController(
        IPasswordService passwordService,
        IRsaEncryptionService rsaEncryption,
        IRsaSessionService sessionService)
    {
        _passwordService = passwordService;
        _rsaEncryption = rsaEncryption;
        _sessionService = sessionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromHeader(Name = "X-Session-Id")] Guid sessionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var session = await _sessionService.GetActiveSessionAsync(userId, sessionId);
        if (session == null || session.ClientPublicKey == null)
        {
            return BadRequest(new { message = "Invalid or incomplete session. Please complete handshake first." });
        }

        var passwords = await _passwordService.GetAllByUserAsync(userId);
        
        // Encrypt each password entry for transport (RSA)
        var encryptedPasswords = new List<PasswordEntryDto>();
        foreach (var pwd in passwords)
        {
            encryptedPasswords.Add(new PasswordEntryDto
            {
                Id = pwd.Id,
                EncryptedSiteName = _rsaEncryption.Encrypt(pwd.EncryptedSiteName, session.ClientPublicKey),
                EncryptedUsername = _rsaEncryption.Encrypt(pwd.EncryptedUsername, session.ClientPublicKey),
                EncryptedPassword = _rsaEncryption.Encrypt(pwd.EncryptedPassword, session.ClientPublicKey),
                EncryptedUrl = _rsaEncryption.Encrypt(pwd.EncryptedUrl, session.ClientPublicKey),
                EncryptedServerIp = pwd.EncryptedServerIp != null ? _rsaEncryption.Encrypt(pwd.EncryptedServerIp, session.ClientPublicKey) : null,
                EncryptedHostname = pwd.EncryptedHostname != null ? _rsaEncryption.Encrypt(pwd.EncryptedHostname, session.ClientPublicKey) : null,
                EncryptedNotes = pwd.EncryptedNotes != null ? _rsaEncryption.Encrypt(pwd.EncryptedNotes, session.ClientPublicKey) : null,
                CreatedAt = pwd.CreatedAt,
                UpdatedAt = pwd.UpdatedAt
            });
        }
        
        return Ok(encryptedPasswords);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, [FromHeader(Name = "X-Session-Id")] Guid sessionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var session = await _sessionService.GetActiveSessionAsync(userId, sessionId);
        if (session == null || session.ClientPublicKey == null)
        {
            return BadRequest(new { message = "Invalid or incomplete session" });
        }

        var password = await _passwordService.GetByIdAsync(id, userId);
        
        if (password == null)
        {
            return NotFound();
        }

        // Encrypt for transport (RSA)
        password.EncryptedSiteName = _rsaEncryption.Encrypt(password.EncryptedSiteName, session.ClientPublicKey);
        password.EncryptedUsername = _rsaEncryption.Encrypt(password.EncryptedUsername, session.ClientPublicKey);
        password.EncryptedPassword = _rsaEncryption.Encrypt(password.EncryptedPassword, session.ClientPublicKey);
        password.EncryptedUrl = _rsaEncryption.Encrypt(password.EncryptedUrl, session.ClientPublicKey);
        if (password.EncryptedServerIp != null)
            password.EncryptedServerIp = _rsaEncryption.Encrypt(password.EncryptedServerIp, session.ClientPublicKey);
        if (password.EncryptedHostname != null)
            password.EncryptedHostname = _rsaEncryption.Encrypt(password.EncryptedHostname, session.ClientPublicKey);
        if (password.EncryptedNotes != null)
            password.EncryptedNotes = _rsaEncryption.Encrypt(password.EncryptedNotes, session.ClientPublicKey);

        return Ok(password);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreatePasswordEntryDto createDto,
        [FromHeader(Name = "X-Session-Id")] Guid sessionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var session = await _sessionService.GetActiveSessionAsync(userId, sessionId);
        if (session == null)
        {
            return BadRequest(new { message = "Invalid session" });
        }

        // Decrypt server's private key
        var serverPrivateKey = System.Text.Encoding.UTF8.GetString(
            Convert.FromBase64String(session.EncryptedServerPrivateKey));

        // Decrypt RSA layer (transport) - data comes encrypted from client
        var plaintextDto = new CreatePasswordEntryDto
        {
            EncryptedSiteName = _rsaEncryption.Decrypt(createDto.EncryptedSiteName, serverPrivateKey),
            EncryptedUsername = _rsaEncryption.Decrypt(createDto.EncryptedUsername, serverPrivateKey),
            EncryptedPassword = _rsaEncryption.Decrypt(createDto.EncryptedPassword, serverPrivateKey),
            EncryptedUrl = _rsaEncryption.Decrypt(createDto.EncryptedUrl, serverPrivateKey),
            EncryptedServerIp = createDto.EncryptedServerIp != null ? _rsaEncryption.Decrypt(createDto.EncryptedServerIp, serverPrivateKey) : null,
            EncryptedHostname = createDto.EncryptedHostname != null ? _rsaEncryption.Decrypt(createDto.EncryptedHostname, serverPrivateKey) : null,
            EncryptedNotes = createDto.EncryptedNotes != null ? _rsaEncryption.Decrypt(createDto.EncryptedNotes, serverPrivateKey) : null
        };

        // Service will encrypt with AES for database
        var password = await _passwordService.CreateAsync(plaintextDto, userId);
        
        // Encrypt response for transport (RSA)
        if (!string.IsNullOrEmpty(session.ClientPublicKey))
        {
            password.EncryptedSiteName = _rsaEncryption.Encrypt(password.EncryptedSiteName, session.ClientPublicKey);
            password.EncryptedUsername = _rsaEncryption.Encrypt(password.EncryptedUsername, session.ClientPublicKey);
            password.EncryptedPassword = _rsaEncryption.Encrypt(password.EncryptedPassword, session.ClientPublicKey);
            password.EncryptedUrl = _rsaEncryption.Encrypt(password.EncryptedUrl, session.ClientPublicKey);
            if (password.EncryptedServerIp != null)
                password.EncryptedServerIp = _rsaEncryption.Encrypt(password.EncryptedServerIp, session.ClientPublicKey);
            if (password.EncryptedHostname != null)
                password.EncryptedHostname = _rsaEncryption.Encrypt(password.EncryptedHostname, session.ClientPublicKey);
            if (password.EncryptedNotes != null)
                password.EncryptedNotes = _rsaEncryption.Encrypt(password.EncryptedNotes, session.ClientPublicKey);
        }

        return CreatedAtAction(nameof(GetById), new { id = password.Id, sessionId }, password);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdatePasswordEntryDto updateDto,
        [FromHeader(Name = "X-Session-Id")] Guid sessionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var session = await _sessionService.GetActiveSessionAsync(userId, sessionId);
        if (session == null)
        {
            return BadRequest(new { message = "Invalid session" });
        }

        // Decrypt server's private key
        var serverPrivateKey = System.Text.Encoding.UTF8.GetString(
            Convert.FromBase64String(session.EncryptedServerPrivateKey));

        // Decrypt RSA layer (transport)
        var plaintextDto = new UpdatePasswordEntryDto
        {
            EncryptedSiteName = _rsaEncryption.Decrypt(updateDto.EncryptedSiteName, serverPrivateKey),
            EncryptedUsername = _rsaEncryption.Decrypt(updateDto.EncryptedUsername, serverPrivateKey),
            EncryptedPassword = _rsaEncryption.Decrypt(updateDto.EncryptedPassword, serverPrivateKey),
            EncryptedUrl = _rsaEncryption.Decrypt(updateDto.EncryptedUrl, serverPrivateKey),
            EncryptedServerIp = updateDto.EncryptedServerIp != null ? _rsaEncryption.Decrypt(updateDto.EncryptedServerIp, serverPrivateKey) : null,
            EncryptedHostname = updateDto.EncryptedHostname != null ? _rsaEncryption.Decrypt(updateDto.EncryptedHostname, serverPrivateKey) : null,
            EncryptedNotes = updateDto.EncryptedNotes != null ? _rsaEncryption.Decrypt(updateDto.EncryptedNotes, serverPrivateKey) : null
        };

        // Service will encrypt with AES for database
        var password = await _passwordService.UpdateAsync(id, plaintextDto, userId);
        
        if (password == null)
        {
            return NotFound();
        }

        // Encrypt response for transport (RSA)
        if (!string.IsNullOrEmpty(session.ClientPublicKey))
        {
            password.EncryptedSiteName = _rsaEncryption.Encrypt(password.EncryptedSiteName, session.ClientPublicKey);
            password.EncryptedUsername = _rsaEncryption.Encrypt(password.EncryptedUsername, session.ClientPublicKey);
            password.EncryptedPassword = _rsaEncryption.Encrypt(password.EncryptedPassword, session.ClientPublicKey);
            password.EncryptedUrl = _rsaEncryption.Encrypt(password.EncryptedUrl, session.ClientPublicKey);
            if (password.EncryptedServerIp != null)
                password.EncryptedServerIp = _rsaEncryption.Encrypt(password.EncryptedServerIp, session.ClientPublicKey);
            if (password.EncryptedHostname != null)
                password.EncryptedHostname = _rsaEncryption.Encrypt(password.EncryptedHostname, session.ClientPublicKey);
            if (password.EncryptedNotes != null)
                password.EncryptedNotes = _rsaEncryption.Encrypt(password.EncryptedNotes, session.ClientPublicKey);
        }

        return Ok(password);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var success = await _passwordService.DeleteAsync(id, userId);
        
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}
