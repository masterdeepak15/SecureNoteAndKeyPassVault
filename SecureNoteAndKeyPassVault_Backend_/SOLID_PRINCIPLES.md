# SOLID Principles Implementation

This document explains how each SOLID principle is implemented in the Secure Notes API.

## 1. Single Responsibility Principle (SRP)

**Definition:** A class should have only one reason to change.

### Implementation:

#### ✅ Separate Concerns

**Controllers** - Only handle HTTP requests/responses:
```csharp
public class NotesController : ControllerBase
{
    // Only handles HTTP routing, validation, and responses
    // Delegates business logic to INoteService
}
```

**Services** - Only handle business logic:
```csharp
public class NoteService : INoteService
{
    // Only handles note-related business logic
    // Delegates data access to IRepository
}
```

**Repositories** - Only handle data access:
```csharp
public class Repository<T> : IRepository<T>
{
    // Only handles database operations
    // No business logic
}
```

**Encryption Service** - Only handles RSA encryption:
```csharp
public class RsaEncryptionService : IRsaEncryptionService
{
    // Only handles RSA encryption/decryption
    // No session management or data access
}
```

#### ✅ Specialized Services

Each service has ONE responsibility:

- `INoteService` → Note business logic only
- `IPasswordService` → Password entry business logic only
- `IRsaEncryptionService` → RSA encryption/decryption only
- `IRsaSessionService` → Session management only

## 2. Open/Closed Principle (OCP)

**Definition:** Software entities should be open for extension but closed for modification.

### Implementation:

#### ✅ Generic Repository Pattern

The generic repository can be extended for any entity type without modification:

```csharp
// Base repository (CLOSED for modification)
public class Repository<T> : IRepository<T> where T : class
{
    // Generic implementation works for ANY entity
}

// Usage (OPEN for extension)
builder.Services.AddScoped<IRepository<Note>, Repository<Note>>();
builder.Services.AddScoped<IRepository<PasswordEntry>, Repository<PasswordEntry>>();
builder.Services.AddScoped<IRepository<YourNewEntity>, Repository<YourNewEntity>>();
```

#### ✅ Interface-Based Design

Add new features without changing existing code:

```csharp
// Want to add a new encryption algorithm?
// Just implement the interface:

public interface IEncryptionService
{
    string Encrypt(string plainText, string key);
    string Decrypt(string encryptedText, string key);
}

// Add AES implementation without touching RSA code
public class AesEncryptionService : IEncryptionService
{
    public string Encrypt(string plainText, string key) { /* ... */ }
    public string Decrypt(string encryptedText, string key) { /* ... */ }
}

// Register in DI container
builder.Services.AddScoped<IEncryptionService, AesEncryptionService>();
```

#### ✅ Extensible Services

Services can be extended by creating new implementations:

```csharp
// Want to add cloud storage for notes?
// Extend without modifying existing code:

public class CloudNoteService : INoteService
{
    private readonly ICloudStorageProvider _cloudStorage;
    
    // New implementation with cloud storage
    public async Task<NoteDto> CreateAsync(CreateNoteDto dto, string userId)
    {
        // Save to cloud instead of local database
    }
}
```

## 3. Liskov Substitution Principle (LSP)

**Definition:** Objects of a superclass should be replaceable with objects of a subclass without breaking the application.

### Implementation:

#### ✅ Proper Interface Implementation

All implementations properly fulfill their interface contracts:

```csharp
// Interface contract
public interface IRepository<T>
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
}

// SQLite implementation
public class Repository<T> : IRepository<T>
{
    public async Task<T?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id); // Returns null if not found
    }
}

// Can be substituted with MongoDB implementation
public class MongoRepository<T> : IRepository<T>
{
    public async Task<T?> GetByIdAsync(Guid id)
    {
        return await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();
    }
}

// Both implementations honor the contract:
// - Return T? (nullable)
// - Return null when not found
// - No exceptions for valid IDs
```

#### ✅ Behavioral Consistency

Services maintain consistent behavior:

```csharp
// Any implementation of INoteService will:
// - Return null when note not found
// - Return false on failed delete
// - Throw exceptions for invalid operations

public class NoteService : INoteService { /* ... */ }
public class CachedNoteService : INoteService { /* ... */ }
public class CloudNoteService : INoteService { /* ... */ }

// All can be used interchangeably:
INoteService service = GetNoteService(); // Could be any implementation
var note = await service.GetByIdAsync(id, userId); // Same behavior guaranteed
```

## 4. Interface Segregation Principle (ISP)

**Definition:** Clients should not be forced to depend on interfaces they don't use.

### Implementation:

#### ✅ Focused Interfaces

Each interface is small and focused:

```csharp
// Small, focused interfaces instead of one large interface

// ❌ BAD - Fat interface
public interface IDataService
{
    Task<Note> GetNote(Guid id);
    Task<Note> CreateNote(Note note);
    Task<PasswordEntry> GetPassword(Guid id);
    Task<PasswordEntry> CreatePassword(PasswordEntry password);
    Task<RsaKeySession> CreateSession(string userId);
    string EncryptData(string data);
    string DecryptData(string data);
}

// ✅ GOOD - Segregated interfaces
public interface INoteService
{
    Task<NoteDto?> GetByIdAsync(Guid id, string userId);
    Task<NoteDto> CreateAsync(CreateNoteDto createDto, string userId);
}

public interface IPasswordService
{
    Task<PasswordEntryDto?> GetByIdAsync(Guid id, string userId);
    Task<PasswordEntryDto> CreateAsync(CreatePasswordEntryDto createDto, string userId);
}

public interface IRsaEncryptionService
{
    string Encrypt(string plainText, string publicKeyXml);
    string Decrypt(string encryptedText, string privateKeyXml);
}
```

#### ✅ Specific Repository Interface

```csharp
// Repository interface only contains data access methods
// No business logic methods
public interface IRepository<T>
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
}

// If you need caching, create a separate interface
public interface ICachedRepository<T> : IRepository<T>
{
    void InvalidateCache(Guid id);
    void ClearCache();
}
```

## 5. Dependency Inversion Principle (DIP)

**Definition:** High-level modules should not depend on low-level modules. Both should depend on abstractions.

### Implementation:

#### ✅ Dependency Injection

All dependencies are injected through interfaces:

```csharp
// ❌ BAD - Direct dependency on concrete class
public class NotesController
{
    private readonly NoteService _noteService; // Concrete class
    
    public NotesController()
    {
        _noteService = new NoteService(); // Tight coupling
    }
}

// ✅ GOOD - Dependency on abstraction
public class NotesController
{
    private readonly INoteService _noteService; // Interface
    
    public NotesController(INoteService noteService) // DI
    {
        _noteService = noteService;
    }
}
```

#### ✅ Abstraction Layers

High-level services depend on abstractions, not concrete implementations:

```csharp
// High-level service
public class NoteService : INoteService
{
    private readonly IRepository<Note> _repository; // Abstraction
    
    public NoteService(IRepository<Note> repository)
    {
        _repository = repository; // No knowledge of SQLite, MongoDB, etc.
    }
}

// Low-level implementation
public class Repository<T> : IRepository<T>
{
    private readonly ApplicationDbContext _context; // Concrete implementation
    
    // But NoteService doesn't know or care about this
}
```

#### ✅ Configuration in Program.cs

All dependencies are configured in one place:

```csharp
// Dependency Inversion at application level
builder.Services.AddScoped<IRepository<Note>, Repository<Note>>();
builder.Services.AddScoped<IRepository<PasswordEntry>, Repository<PasswordEntry>>();
builder.Services.AddScoped<INoteService, NoteService>();
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<IRsaEncryptionService, RsaEncryptionService>();

// Easy to swap implementations:
// builder.Services.AddScoped<INoteService, CachedNoteService>();
// builder.Services.AddScoped<IRepository<Note>, MongoRepository<Note>>();
```

## Benefits of SOLID Implementation

### 1. Testability
```csharp
// Easy to mock dependencies for unit testing
public class NoteServiceTests
{
    [Fact]
    public async Task CreateNote_ShouldReturnNote()
    {
        // Arrange
        var mockRepository = new Mock<IRepository<Note>>();
        var service = new NoteService(mockRepository.Object);
        
        // Act & Assert
        // ...
    }
}
```

### 2. Maintainability
- Changes in one area don't affect others
- Each class has a clear, single purpose
- Easy to locate and fix bugs

### 3. Extensibility
- Add new features without modifying existing code
- Easy to add new implementations
- Swap implementations without breaking changes

### 4. Flexibility
```csharp
// Switch from SQLite to PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString)); // Just change this line

// Add caching layer
builder.Services.AddScoped<INoteService, CachedNoteService>();

// Add logging decorator
builder.Services.Decorate<INoteService, LoggingNoteService>();
```

## Real-World Example: Adding a New Feature

### Requirement: Add Email Notifications When Note is Created

#### ✅ SOLID Approach:

**1. Create Interface (ISP, DIP)**
```csharp
public interface IEmailService
{
    Task SendNoteCreatedEmailAsync(string userEmail, string noteTitle);
}
```

**2. Create Implementation (SRP)**
```csharp
public class EmailService : IEmailService
{
    public async Task SendNoteCreatedEmailAsync(string userEmail, string noteTitle)
    {
        // Only handles email sending
    }
}
```

**3. Register in DI (DIP)**
```csharp
builder.Services.AddScoped<IEmailService, EmailService>();
```

**4. Inject into Service (DIP)**
```csharp
public class NoteService : INoteService
{
    private readonly IRepository<Note> _repository;
    private readonly IEmailService _emailService; // New dependency
    
    public NoteService(
        IRepository<Note> repository,
        IEmailService emailService)
    {
        _repository = repository;
        _emailService = emailService;
    }
    
    public async Task<NoteDto> CreateAsync(CreateNoteDto dto, string userId)
    {
        // Create note
        var note = await _repository.AddAsync(/* ... */);
        
        // Send email
        await _emailService.SendNoteCreatedEmailAsync(userEmail, note.Title);
        
        return MapToDto(note);
    }
}
```

**Benefits:**
- ✅ No modification to existing classes (OCP)
- ✅ Email service has single responsibility (SRP)
- ✅ Depends on abstraction (DIP)
- ✅ Small, focused interface (ISP)
- ✅ Easy to test with mock IEmailService (LSP)

---

## Summary

Every class and interface in this project follows SOLID principles:

| Principle | Implementation |
|-----------|----------------|
| **SRP** | Separate services for notes, passwords, encryption, sessions |
| **OCP** | Generic repository, interface-based design |
| **LSP** | Proper interface contracts, behavioral consistency |
| **ISP** | Small, focused interfaces for each concern |
| **DIP** | Dependency injection, abstraction layers |

This makes the codebase:
- ✅ Easy to test
- ✅ Easy to maintain
- ✅ Easy to extend
- ✅ Easy to understand
- ✅ Production-ready
