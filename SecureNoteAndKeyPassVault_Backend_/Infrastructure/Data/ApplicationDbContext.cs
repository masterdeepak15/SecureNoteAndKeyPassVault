using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SecureNotesAPI.Domain.Entities;

namespace SecureNotesAPI.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Note> Notes { get; set; }
    public DbSet<PasswordEntry> PasswordEntries { get; set; }
    public DbSet<RsaKeySession> RsaKeySessions { get; set; }
    public DbSet<UserSession> UserSessions { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Note>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");
        });

        builder.Entity<PasswordEntry>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("datetime('now')");
        });

        builder.Entity<RsaKeySession>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.IsActive });
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
        });

        builder.Entity<UserSession>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.TokenId);
            entity.HasIndex(e => new { e.UserId, e.IsActive });
            entity.HasIndex(e => e.LastActivityAt);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("datetime('now')");
            entity.Property(e => e.LastActivityAt).HasDefaultValueSql("datetime('now')");
        });
    }
}
