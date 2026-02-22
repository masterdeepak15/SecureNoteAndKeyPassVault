using SecureNotesAPI.Application.DTOs;

namespace SecureNotesAPI.Application.Interfaces;

public interface INoteService
{
    Task<NoteDto?> GetByIdAsync(Guid id, string userId);
    Task<IEnumerable<NoteDto>> GetAllByUserAsync(string userId);
    Task<NoteDto> CreateAsync(CreateNoteDto createDto, string userId);
    Task<NoteDto?> UpdateAsync(Guid id, UpdateNoteDto updateDto, string userId);
    Task<bool> DeleteAsync(Guid id, string userId);
}
