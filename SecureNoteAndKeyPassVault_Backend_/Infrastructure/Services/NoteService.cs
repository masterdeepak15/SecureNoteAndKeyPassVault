using SecureNotesAPI.Application.DTOs;
using SecureNotesAPI.Application.Interfaces;
using SecureNotesAPI.Domain.Entities;

namespace SecureNotesAPI.Infrastructure.Services;

public class NoteService : INoteService
{
    private readonly IRepository<Note> _noteRepository;
    private readonly IAesEncryptionService _aesEncryption;

    public NoteService(
        IRepository<Note> noteRepository,
        IAesEncryptionService aesEncryption)
    {
        _noteRepository = noteRepository;
        _aesEncryption = aesEncryption;
    }

    public async Task<NoteDto?> GetByIdAsync(Guid id, string userId)
    {
        var note = await _noteRepository.GetByIdAsync(id);
        
        if (note == null || note.UserId != userId || note.IsDeleted)
        {
            return null;
        }

        // STORAGE LAYER: Decrypt from database (AES)
        // Result is plaintext (briefly in memory)
        var plaintextTitle = _aesEncryption.DecryptFromStorage(note.EncryptedTitle);
        var plaintextContent = _aesEncryption.DecryptFromStorage(note.EncryptedContent);

        // Return plaintext - controller will handle RSA encryption for transport
        return new NoteDto
        {
            Id = note.Id,
            EncryptedTitle = plaintextTitle,  // Actually plaintext
            EncryptedContent = plaintextContent,  // Actually plaintext
            CreatedAt = note.CreatedAt,
            UpdatedAt = note.UpdatedAt
        };
    }

    public async Task<IEnumerable<NoteDto>> GetAllByUserAsync(string userId)
    {
        var notes = await _noteRepository.FindAsync(n => 
            n.UserId == userId && !n.IsDeleted);
        
        var decryptedNotes = new List<NoteDto>();
        
        foreach (var note in notes)
        {
            // STORAGE LAYER: Decrypt from database (AES)
            var plaintextTitle = _aesEncryption.DecryptFromStorage(note.EncryptedTitle);
            var plaintextContent = _aesEncryption.DecryptFromStorage(note.EncryptedContent);
            
            decryptedNotes.Add(new NoteDto
            {
                Id = note.Id,
                EncryptedTitle = plaintextTitle,  // Actually plaintext
                EncryptedContent = plaintextContent,  // Actually plaintext
                CreatedAt = note.CreatedAt,
                UpdatedAt = note.UpdatedAt
            });
        }
        
        return decryptedNotes.OrderByDescending(n => n.UpdatedAt);
    }

    public async Task<NoteDto> CreateAsync(CreateNoteDto createDto, string userId)
    {
        // ENCRYPTION FLOW:
        // Client: plaintext → RSA encrypt → "aBc123..."
        // Network: "aBc123..."
        // Server receives: "aBc123..." (in createDto.EncryptedContent)
        // 
        // NOTE: The controller should decrypt RSA BEFORE calling this service!
        // This service assumes it receives PLAINTEXT from controller
        // 
        // Then: plaintext → AES encrypt → "DeF456..." → Database
        
        // Encrypt plaintext for database storage (AES)
        var aesEncryptedTitle = _aesEncryption.EncryptForStorage(createDto.EncryptedTitle);
        var aesEncryptedContent = _aesEncryption.EncryptForStorage(createDto.EncryptedContent);
        
        var note = new Note
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            EncryptedTitle = aesEncryptedTitle,
            EncryptedContent = aesEncryptedContent,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        await _noteRepository.AddAsync(note);
        await _noteRepository.SaveChangesAsync();

        // Return plaintext (controller will encrypt with RSA for transport)
        return new NoteDto
        {
            Id = note.Id,
            EncryptedTitle = createDto.EncryptedTitle,  // Plaintext
            EncryptedContent = createDto.EncryptedContent,  // Plaintext
            CreatedAt = note.CreatedAt,
            UpdatedAt = note.UpdatedAt
        };
    }

    public async Task<NoteDto?> UpdateAsync(Guid id, UpdateNoteDto updateDto, string userId)
    {
        var note = await _noteRepository.GetByIdAsync(id);
        
        if (note == null || note.UserId != userId || note.IsDeleted)
        {
            return null;
        }

        // Encrypt plaintext for database storage (AES)
        note.EncryptedTitle = _aesEncryption.EncryptForStorage(updateDto.EncryptedTitle);
        note.EncryptedContent = _aesEncryption.EncryptForStorage(updateDto.EncryptedContent);
        note.UpdatedAt = DateTime.UtcNow;

        await _noteRepository.UpdateAsync(note);
        await _noteRepository.SaveChangesAsync();

        // Return plaintext (controller will encrypt with RSA for transport)
        return new NoteDto
        {
            Id = note.Id,
            EncryptedTitle = updateDto.EncryptedTitle,  // Plaintext
            EncryptedContent = updateDto.EncryptedContent,  // Plaintext
            CreatedAt = note.CreatedAt,
            UpdatedAt = note.UpdatedAt
        };
    }

    public async Task<bool> DeleteAsync(Guid id, string userId)
    {
        var note = await _noteRepository.GetByIdAsync(id);
        
        if (note == null || note.UserId != userId || note.IsDeleted)
        {
            return false;
        }

        // Soft delete
        note.IsDeleted = true;
        note.UpdatedAt = DateTime.UtcNow;

        await _noteRepository.UpdateAsync(note);
        await _noteRepository.SaveChangesAsync();

        return true;
    }
}
