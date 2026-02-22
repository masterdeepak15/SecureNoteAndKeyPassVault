using SecureNotesAPI.Application.DTOs;

namespace SecureNotesAPI.Application.Interfaces;

public interface IPasswordService
{
    Task<PasswordEntryDto?> GetByIdAsync(Guid id, string userId);
    Task<IEnumerable<PasswordEntryDto>> GetAllByUserAsync(string userId);
    Task<PasswordEntryDto> CreateAsync(CreatePasswordEntryDto createDto, string userId);
    Task<PasswordEntryDto?> UpdateAsync(Guid id, UpdatePasswordEntryDto updateDto, string userId);
    Task<bool> DeleteAsync(Guid id, string userId);
}
