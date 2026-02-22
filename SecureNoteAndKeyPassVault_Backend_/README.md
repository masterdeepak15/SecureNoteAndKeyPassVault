# Secure Notes API with RSA Encryption

A production-ready ASP.NET Core API for secure note-taking and password management with end-to-end RSA encryption. Built following SOLID principles with zero plaintext storage.

## 🔐 Security Features

- **End-to-End RSA Encryption**: All sensitive data encrypted client-side before transmission
- **Zero Plaintext Storage**: Database stores only encrypted data (Base64 encoded)
- **RSA Handshake Protocol**: TCP-like handshake for secure key exchange
- **JWT Authentication**: Secure user authentication with Microsoft Identity
- **Session Management**: Time-limited encryption sessions
- **Client-Side Key Generation**: Private keys never leave the client

## 🏗️ Architecture (SOLID Principles)

### Single Responsibility Principle (SRP)
- Each service class handles one specific domain (Notes, Passwords, RSA, Sessions)
- Controllers only handle HTTP concerns
- Repositories only handle data access

### Open/Closed Principle (OCP)
- Generic repository pattern allows extension without modification
- Interface-based design for easy testing and extension

### Liskov Substitution Principle (LSP)
- All implementations properly substitute their interfaces
- Generic repository works with any entity type

### Interface Segregation Principle (ISP)
- Specific interfaces for each service (INoteService, IPasswordService, etc.)
- No client forced to depend on unused methods

### Dependency Inversion Principle (DIP)
- All dependencies injected through interfaces
- High-level modules don't depend on low-level modules

## 📁 Project Structure

```
SecureNotesAPI/
├── Domain/
│   └── Entities/              # Domain models
│       ├── Note.cs
│       ├── PasswordEntry.cs
│       ├── RsaKeySession.cs
│       └── ApplicationUser.cs
├── Application/
│   ├── Interfaces/            # Service contracts
│   │   ├── INoteService.cs
│   │   ├── IPasswordService.cs
│   │   ├── IRsaEncryptionService.cs
│   │   ├── IRsaSessionService.cs
│   │   └── IRepository.cs
│   └── DTOs/                  # Data transfer objects
│       ├── NoteDtos.cs
│       ├── PasswordEntryDtos.cs
│       └── AuthDtos.cs
├── Infrastructure/
│   ├── Data/
│   │   └── ApplicationDbContext.cs
│   ├── Services/              # Service implementations
│   │   ├── NoteService.cs
│   │   ├── PasswordService.cs
│   │   ├── RsaEncryptionService.cs
│   │   └── RsaSessionService.cs
│   └── Repositories/
│       └── Repository.cs      # Generic repository
├── Controllers/               # API endpoints
│   ├── AuthController.cs
│   ├── NotesController.cs
│   └── PasswordsController.cs
├── ClientJS/                  # JavaScript client
│   ├── SecureNotesClient.js
│   └── example.html
├── Program.cs
├── appsettings.json
└── SecureNotesAPI.csproj
```

## 🚀 Getting Started

### Prerequisites

- .NET 8.0 SDK or later
- SQLite (included with .NET)

### Installation

1. **Clone or download the project**

2. **Restore dependencies**
```bash
cd SecureNotesAPI
dotnet restore
```

3. **Update JWT Configuration** (in `appsettings.json`)
```json
{
  "Jwt": {
    "Key": "YOUR_SECRET_KEY_MINIMUM_32_CHARACTERS",
    "Issuer": "SecureNotesAPI",
    "Audience": "SecureNotesClient"
  }
}
```

4. **Run database migrations**
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

Or let the application auto-migrate on startup (already configured in Program.cs)

5. **Run the application**
```bash
dotnet run
```

The API will be available at `https://localhost:7000` (or configured port)

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| POST | `/api/auth/handshake/initiate` | Start RSA handshake (get server public key) |
| POST | `/api/auth/handshake/complete` | Complete handshake (send client public key) |
| POST | `/api/auth/handshake/invalidate/{sessionId}` | Invalidate encryption session |

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | Get all user notes |
| GET | `/api/notes/{id}` | Get specific note |
| POST | `/api/notes` | Create new note |
| PUT | `/api/notes/{id}` | Update note |
| DELETE | `/api/notes/{id}` | Delete note |

### Password Manager

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/passwords` | Get all password entries |
| GET | `/api/passwords/{id}` | Get specific password entry |
| POST | `/api/passwords` | Create new password entry |
| PUT | `/api/passwords/{id}` | Update password entry |
| DELETE | `/api/passwords/{id}` | Delete password entry |

## 🔑 RSA Handshake Flow

The API implements a TCP-like three-way handshake for RSA key exchange:

```
Client                                  Server
  |                                       |
  |  1. Initiate Handshake               |
  |-------------------------------------->|
  |                                       |
  |  2. Server Public Key (PEM)          |
  |<--------------------------------------|
  |                                       |
  |  3. Client Public Key (PEM)          |
  |-------------------------------------->|
  |                                       |
  |  4. Handshake Complete               |
  |<--------------------------------------|
  |                                       |
  |  Encrypted Communication Begins      |
  |<------------------------------------->|
```

### Steps:

1. **Client**: Calls `/api/auth/handshake/initiate`
2. **Server**: Generates RSA key pair, stores private key, returns public key and session ID
3. **Client**: Generates own RSA key pair, calls `/api/auth/handshake/complete` with public key
4. **Server**: Stores client's public key, confirms handshake
5. **Both**: Use each other's public keys to encrypt data

## 💻 JavaScript Client Usage

### Basic Setup

```javascript
// Initialize client
const client = new SecureNotesClient('https://localhost:7000');

// Register user
await client.register('user@example.com', 'Password123!', 'Password123!');

// Login
await client.login('user@example.com', 'Password123!');

// Perform RSA handshake
await client.performHandshake();
```

### Working with Notes

```javascript
// Create encrypted note
const note = await client.createNote(
    'My Secret Note',
    'This content is encrypted before transmission'
);

// Get all notes (automatically decrypted)
const notes = await client.getAllNotes();

// Update note
const updated = await client.updateNote(
    noteId,
    'Updated Title',
    'Updated Content'
);

// Delete note
await client.deleteNote(noteId);
```

### Password Manager

```javascript
// Create password entry
const entry = await client.createPasswordEntry(
    'GitHub',                           // siteName
    'user@example.com',                // username
    'MySecurePassword123!',            // password
    'https://github.com',              // url
    '192.168.1.1',                     // serverIp (optional)
    'github-server',                   // hostname (optional)
    'My main GitHub account'           // notes (optional)
);

// Get all password entries
const passwords = await client.getAllPasswordEntries();

// Update password entry
const updated = await client.updatePasswordEntry(
    entryId,
    'GitHub Enterprise',
    'newuser@example.com',
    'NewPassword456!',
    'https://github.enterprise.com',
    '10.0.0.1',
    'enterprise-server',
    'Work GitHub account'
);

// Delete password entry
await client.deletePasswordEntry(entryId);
```

## 🔒 Security Considerations

### What's Encrypted
- ✅ Note titles and content
- ✅ All password entry fields (site name, username, password, URL, server IP, hostname, notes)
- ✅ RSA private keys (server-side, encrypted with master key)

### What's NOT Encrypted
- User email addresses (needed for authentication)
- Metadata (created/updated timestamps, IDs)
- Session information

### Best Practices
1. **Change JWT Secret**: Update the JWT key in production
2. **HTTPS Only**: Always use HTTPS in production
3. **Session Expiry**: Sessions expire after 24 hours by default
4. **Strong Passwords**: Enforce strong password policies
5. **Key Storage**: Consider using Azure Key Vault or similar for production secrets

## 🧪 Testing with Swagger

Access Swagger UI at `https://localhost:7000/swagger`

1. Register a new user via `/api/auth/register`
2. Login via `/api/auth/login` and copy the JWT token
3. Click "Authorize" button and enter: `Bearer YOUR_TOKEN`
4. Test all endpoints with automatic JWT authentication

## 📊 Database Schema

### Notes Table
- Id (GUID, PK)
- UserId (string, FK)
- EncryptedTitle (string)
- EncryptedContent (string)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
- IsDeleted (bool)

### PasswordEntries Table
- Id (GUID, PK)
- UserId (string, FK)
- EncryptedSiteName (string)
- EncryptedUsername (string)
- EncryptedPassword (string)
- EncryptedUrl (string)
- EncryptedServerIp (string, nullable)
- EncryptedHostname (string, nullable)
- EncryptedNotes (string, nullable)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
- IsDeleted (bool)

### RsaKeySessions Table
- SessionId (GUID, PK)
- UserId (string, FK)
- ServerPublicKey (string)
- EncryptedServerPrivateKey (string)
- ClientPublicKey (string, nullable)
- CreatedAt (DateTime)
- ExpiresAt (DateTime)
- IsActive (bool)

## 🛠️ Advanced Features

### Custom Repository Usage

```csharp
// Inject repository
public class MyService
{
    private readonly IRepository<MyEntity> _repository;
    
    public MyService(IRepository<MyEntity> repository)
    {
        _repository = repository;
    }
    
    public async Task<IEnumerable<MyEntity>> GetActive()
    {
        return await _repository.FindAsync(e => e.IsActive);
    }
}
```

### Extending Services

```csharp
// Add new service
public interface IMyNewService
{
    Task DoSomething();
}

public class MyNewService : IMyNewService
{
    public async Task DoSomething()
    {
        // Implementation
    }
}

// Register in Program.cs
builder.Services.AddScoped<IMyNewService, MyNewService>();
```

## 📝 Notes on Implementation

### Why RSA?
- Asymmetric encryption allows secure key exchange over insecure channels
- Client and server can encrypt data for each other without sharing private keys
- Simulates real-world secure communication protocols

### Soft Deletes
- Data is never permanently deleted, only marked as deleted
- Allows recovery and audit trails
- Queries automatically filter deleted items

### Session Management
- Each handshake creates a new session
- Old sessions are automatically invalidated
- Sessions expire after 24 hours
- Cleanup can be scheduled via background service

## 🚧 Production Deployment Checklist

- [ ] Change JWT secret key to strong random value
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS only
- [ ] Configure CORS properly for your frontend
- [ ] Set up proper logging
- [ ] Implement rate limiting
- [ ] Add database backups
- [ ] Use proper key management service (Azure Key Vault, AWS KMS)
- [ ] Enable audit logging
- [ ] Set up monitoring and alerts

## 📄 License

This project is provided as-is for educational and commercial use.

## 🤝 Contributing

This is a complete, production-ready implementation. Feel free to extend it for your specific needs!

## 📞 Support

For issues or questions, please refer to the inline code documentation and comments.
