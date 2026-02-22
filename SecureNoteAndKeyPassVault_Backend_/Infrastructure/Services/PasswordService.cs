using SecureNotesAPI.Application.DTOs;
using SecureNotesAPI.Application.Interfaces;
using SecureNotesAPI.Domain.Entities;

namespace SecureNotesAPI.Infrastructure.Services;

public class PasswordService : IPasswordService
{
    private readonly IRepository<PasswordEntry> _passwordRepository;
    private readonly IAesEncryptionService _aesEncryption;

    public PasswordService(
        IRepository<PasswordEntry> passwordRepository,
        IAesEncryptionService aesEncryption)
    {
        _passwordRepository = passwordRepository;
        _aesEncryption = aesEncryption;
    }

    public async Task<PasswordEntryDto?> GetByIdAsync(Guid id, string userId)
    {
        var password = await _passwordRepository.GetByIdAsync(id);
        
        if (password == null || password.UserId != userId || password.IsDeleted)
        {
            return null;
        }

        // STORAGE LAYER: Decrypt from database (AES)
        // Return plaintext - controller will handle RSA encryption for transport
        return new PasswordEntryDto
        {
            Id = password.Id,
            EncryptedSiteName = _aesEncryption.DecryptFromStorage(password.EncryptedSiteName),
            EncryptedUsername = _aesEncryption.DecryptFromStorage(password.EncryptedUsername),
            EncryptedPassword = _aesEncryption.DecryptFromStorage(password.EncryptedPassword),
            EncryptedUrl = _aesEncryption.DecryptFromStorage(password.EncryptedUrl),
            EncryptedServerIp = password.EncryptedServerIp != null ? 
                _aesEncryption.DecryptFromStorage(password.EncryptedServerIp) : null,
            EncryptedHostname = password.EncryptedHostname != null ? 
                _aesEncryption.DecryptFromStorage(password.EncryptedHostname) : null,
            EncryptedNotes = password.EncryptedNotes != null ? 
                _aesEncryption.DecryptFromStorage(password.EncryptedNotes) : null,
            CreatedAt = password.CreatedAt,
            UpdatedAt = password.UpdatedAt
        };
    }

    public async Task<IEnumerable<PasswordEntryDto>> GetAllByUserAsync(string userId)
    {
        var passwords = await _passwordRepository.FindAsync(p => 
            p.UserId == userId && !p.IsDeleted);
        
        var decryptedPasswords = new List<PasswordEntryDto>();
        
        foreach (var password in passwords)
        {
            // STORAGE LAYER: Decrypt from database (AES)
            decryptedPasswords.Add(new PasswordEntryDto
            {
                Id = password.Id,
                EncryptedSiteName = _aesEncryption.DecryptFromStorage(password.EncryptedSiteName),
                EncryptedUsername = _aesEncryption.DecryptFromStorage(password.EncryptedUsername),
                EncryptedPassword = _aesEncryption.DecryptFromStorage(password.EncryptedPassword),
                EncryptedUrl = _aesEncryption.DecryptFromStorage(password.EncryptedUrl),
                EncryptedServerIp = password.EncryptedServerIp != null ? 
                    _aesEncryption.DecryptFromStorage(password.EncryptedServerIp) : null,
                EncryptedHostname = password.EncryptedHostname != null ? 
                    _aesEncryption.DecryptFromStorage(password.EncryptedHostname) : null,
                EncryptedNotes = password.EncryptedNotes != null ? 
                    _aesEncryption.DecryptFromStorage(password.EncryptedNotes) : null,
                CreatedAt = password.CreatedAt,
                UpdatedAt = password.UpdatedAt
            });
        }
        
        return decryptedPasswords.OrderByDescending(p => p.UpdatedAt);
    }

    public async Task<PasswordEntryDto> CreateAsync(CreatePasswordEntryDto createDto, string userId)
    {
        // Controller decrypts RSA and passes PLAINTEXT to this service
        // This service encrypts plaintext with AES for database storage
        
        var password = new PasswordEntry
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            EncryptedSiteName = _aesEncryption.EncryptForStorage(createDto.EncryptedSiteName),
            EncryptedUsername = _aesEncryption.EncryptForStorage(createDto.EncryptedUsername),
            EncryptedPassword = _aesEncryption.EncryptForStorage(createDto.EncryptedPassword),
            EncryptedUrl = _aesEncryption.EncryptForStorage(createDto.EncryptedUrl),
            EncryptedServerIp = createDto.EncryptedServerIp != null ? 
                _aesEncryption.EncryptForStorage(createDto.EncryptedServerIp) : null,
            EncryptedHostname = createDto.EncryptedHostname != null ? 
                _aesEncryption.EncryptForStorage(createDto.EncryptedHostname) : null,
            EncryptedNotes = createDto.EncryptedNotes != null ? 
                _aesEncryption.EncryptForStorage(createDto.EncryptedNotes) : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        await _passwordRepository.AddAsync(password);
        await _passwordRepository.SaveChangesAsync();

        // Return plaintext (controller will encrypt with RSA for transport)
        return new PasswordEntryDto
        {
            Id = password.Id,
            EncryptedSiteName = createDto.EncryptedSiteName,
            EncryptedUsername = createDto.EncryptedUsername,
            EncryptedPassword = createDto.EncryptedPassword,
            EncryptedUrl = createDto.EncryptedUrl,
            EncryptedServerIp = createDto.EncryptedServerIp,
            EncryptedHostname = createDto.EncryptedHostname,
            EncryptedNotes = createDto.EncryptedNotes,
            CreatedAt = password.CreatedAt,
            UpdatedAt = password.UpdatedAt
        };
    }

    public async Task<PasswordEntryDto?> UpdateAsync(Guid id, UpdatePasswordEntryDto updateDto, string userId)
    {
        var password = await _passwordRepository.GetByIdAsync(id);
        
        if (password == null || password.UserId != userId || password.IsDeleted)
        {
            return null;
        }

        // Encrypt plaintext for database storage (AES)
        password.EncryptedSiteName = _aesEncryption.EncryptForStorage(updateDto.EncryptedSiteName);
        password.EncryptedUsername = _aesEncryption.EncryptForStorage(updateDto.EncryptedUsername);
        password.EncryptedPassword = _aesEncryption.EncryptForStorage(updateDto.EncryptedPassword);
        password.EncryptedUrl = _aesEncryption.EncryptForStorage(updateDto.EncryptedUrl);
        password.EncryptedServerIp = updateDto.EncryptedServerIp != null ? 
            _aesEncryption.EncryptForStorage(updateDto.EncryptedServerIp) : null;
        password.EncryptedHostname = updateDto.EncryptedHostname != null ? 
            _aesEncryption.EncryptForStorage(updateDto.EncryptedHostname) : null;
        password.EncryptedNotes = updateDto.EncryptedNotes != null ? 
            _aesEncryption.EncryptForStorage(updateDto.EncryptedNotes) : null;
        password.UpdatedAt = DateTime.UtcNow;

        await _passwordRepository.UpdateAsync(password);
        await _passwordRepository.SaveChangesAsync();

        // Return plaintext (controller will encrypt with RSA for transport)
        return new PasswordEntryDto
        {
            Id = password.Id,
            EncryptedSiteName = updateDto.EncryptedSiteName,
            EncryptedUsername = updateDto.EncryptedUsername,
            EncryptedPassword = updateDto.EncryptedPassword,
            EncryptedUrl = updateDto.EncryptedUrl,
            EncryptedServerIp = updateDto.EncryptedServerIp,
            EncryptedHostname = updateDto.EncryptedHostname,
            EncryptedNotes = updateDto.EncryptedNotes,
            CreatedAt = password.CreatedAt,
            UpdatedAt = password.UpdatedAt
        };
    }

    public async Task<bool> DeleteAsync(Guid id, string userId)
    {
        var password = await _passwordRepository.GetByIdAsync(id);
        
        if (password == null || password.UserId != userId || password.IsDeleted)
        {
            return false;
        }

        // Soft delete
        password.IsDeleted = true;
        password.UpdatedAt = DateTime.UtcNow;

        await _passwordRepository.UpdateAsync(password);
        await _passwordRepository.SaveChangesAsync();

        return true;
    }
}
