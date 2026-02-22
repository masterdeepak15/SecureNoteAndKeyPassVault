namespace SecureNotesAPI.Application.DTOs;

public class NoteDto
{
    public Guid Id { get; set; }
    public string EncryptedTitle { get; set; } = string.Empty;
    public string EncryptedContent { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateNoteDto
{
    public string EncryptedTitle { get; set; } = string.Empty;
    public string EncryptedContent { get; set; } = string.Empty;
}

public class UpdateNoteDto
{
    public string EncryptedTitle { get; set; } = string.Empty;
    public string EncryptedContent { get; set; } = string.Empty;
}
