using Microsoft.AspNetCore.Identity;

namespace SecureNotesAPI.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public DateTime CreatedAt { get; set; }
    
    public DateTime? LastLoginAt { get; set; }
}
