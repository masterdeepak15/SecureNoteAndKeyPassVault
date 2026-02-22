using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecureNotesAPI.Application.DTOs;
using SecureNotesAPI.Application.Interfaces;
using System.Security.Claims;

namespace SecureNotesAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotesController : ControllerBase
{
    private readonly INoteService _noteService;
    private readonly IRsaEncryptionService _rsaEncryption;
    private readonly IRsaSessionService _sessionService;

    public NotesController(
        INoteService noteService,
        IRsaEncryptionService rsaEncryption,
        IRsaSessionService sessionService)
    {
        _noteService = noteService;
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

        // Get session to access encryption keys
        var session = await _sessionService.GetActiveSessionAsync(userId, sessionId);
        if (session == null || session.ClientPublicKey == null)
        {
            return BadRequest(new { message = "Invalid or incomplete session. Please complete handshake first." });
        }

        // Get notes from service (returns plaintext)
        var notes = await _noteService.GetAllByUserAsync(userId);
        
        // Encrypt each note for transport (RSA)
        var encryptedNotes = new List<NoteDto>();
        foreach (var note in notes)
        {
            var encryptedTitle = _rsaEncryption.Encrypt(note.EncryptedTitle, session.ClientPublicKey);
            var encryptedContent = _rsaEncryption.Encrypt(note.EncryptedContent, session.ClientPublicKey);
            
            encryptedNotes.Add(new NoteDto
            {
                Id = note.Id,
                EncryptedTitle = encryptedTitle,
                EncryptedContent = encryptedContent,
                CreatedAt = note.CreatedAt,
                UpdatedAt = note.UpdatedAt
            });
        }
        
        return Ok(encryptedNotes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, [FromHeader(Name = "X-Session-Id")] Guid sessionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Get session
        var session = await _sessionService.GetActiveSessionAsync(userId, sessionId);
        if (session == null || session.ClientPublicKey == null)
        {
            return BadRequest(new { message = "Invalid or incomplete session" });
        }

        // Get note (returns plaintext)
        var note = await _noteService.GetByIdAsync(id, userId);
        
        if (note == null)
        {
            return NotFound();
        }

        // Encrypt for transport (RSA)
        note.EncryptedTitle = _rsaEncryption.Encrypt(note.EncryptedTitle, session.ClientPublicKey);
        note.EncryptedContent = _rsaEncryption.Encrypt(note.EncryptedContent, session.ClientPublicKey);

        return Ok(note);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateNoteDto createDto,
        [FromHeader(Name = "X-Session-Id")] Guid sessionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Get session to decrypt incoming RSA data
        var session = await _sessionService.GetActiveSessionAsync(userId, sessionId);
        if (session == null)
        {
            return BadRequest(new { message = "Invalid session" });
        }

        // Decrypt server's private key (it's stored encrypted in DB)
        var serverPrivateKey = System.Text.Encoding.UTF8.GetString(
            Convert.FromBase64String(session.EncryptedServerPrivateKey));

        // Decrypt RSA layer (transport) - data comes encrypted from client
        var plaintextTitle = _rsaEncryption.Decrypt(createDto.EncryptedTitle, serverPrivateKey);
        var plaintextContent = _rsaEncryption.Decrypt(createDto.EncryptedContent, serverPrivateKey);

        // Create DTO with plaintext for service
        var plaintextDto = new CreateNoteDto
        {
            EncryptedTitle = plaintextTitle,  // Actually plaintext now
            EncryptedContent = plaintextContent  // Actually plaintext now
        };

        // Service will encrypt with AES for database
        var note = await _noteService.CreateAsync(plaintextDto, userId);
        
        // Encrypt response for transport (RSA) if we have client public key
        if (!string.IsNullOrEmpty(session.ClientPublicKey))
        {
            note.EncryptedTitle = _rsaEncryption.Encrypt(note.EncryptedTitle, session.ClientPublicKey);
            note.EncryptedContent = _rsaEncryption.Encrypt(note.EncryptedContent, session.ClientPublicKey);
        }

        return CreatedAtAction(nameof(GetById), new { id = note.Id, sessionId }, note);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateNoteDto updateDto,
        [FromHeader(Name = "X-Session-Id")] Guid sessionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Get session
        var session = await _sessionService.GetActiveSessionAsync(userId, sessionId);
        if (session == null)
        {
            return BadRequest(new { message = "Invalid session" });
        }

        // Decrypt server's private key
        var serverPrivateKey = System.Text.Encoding.UTF8.GetString(
            Convert.FromBase64String(session.EncryptedServerPrivateKey));

        // Decrypt RSA layer (transport)
        var plaintextTitle = _rsaEncryption.Decrypt(updateDto.EncryptedTitle, serverPrivateKey);
        var plaintextContent = _rsaEncryption.Decrypt(updateDto.EncryptedContent, serverPrivateKey);

        var plaintextDto = new UpdateNoteDto
        {
            EncryptedTitle = plaintextTitle,
            EncryptedContent = plaintextContent
        };

        // Service will encrypt with AES for database
        var note = await _noteService.UpdateAsync(id, plaintextDto, userId);
        
        if (note == null)
        {
            return NotFound();
        }

        // Encrypt response for transport (RSA)
        if (!string.IsNullOrEmpty(session.ClientPublicKey))
        {
            note.EncryptedTitle = _rsaEncryption.Encrypt(note.EncryptedTitle, session.ClientPublicKey);
            note.EncryptedContent = _rsaEncryption.Encrypt(note.EncryptedContent, session.ClientPublicKey);
        }

        return Ok(note);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var success = await _noteService.DeleteAsync(id, userId);
        
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}
