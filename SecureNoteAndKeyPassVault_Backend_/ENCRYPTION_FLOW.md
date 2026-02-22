# 🔐 Complete Encryption Flow Documentation

## Architecture Overview

This system uses **TWO SEPARATE encryption layers** for different purposes:

1. **Transport Layer (RSA)** - Protects data ONLY during transmission
2. **Storage Layer (AES-256)** - Protects data ONLY in the database

**CRITICAL:** These are NOT double encryption of the same data. Each serves a different purpose.

---

## Visual Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    CREATE NOTE FLOW                          │
└──────────────────────────────────────────────────────────────┘

CLIENT                    NETWORK                   SERVER                    DATABASE
------                    -------                   ------                    --------

"My Secret"
    ↓
[RSA Encrypt]
Server Pub Key
    ↓
"aBc123XyZ..."  ────────→  "aBc123XyZ..."  
                 HTTPS          ↓
                           [RSA Decrypt]
                           Server Priv Key
                                ↓
                           "My Secret"
                           (plaintext in
                            memory ~1ms)
                                ↓
                           [AES Encrypt]
                           Master Key
                                ↓
                           "DeF456uVw..."  ──────→  STORE: "DeF456uVw..."


┌──────────────────────────────────────────────────────────────┐
│                     READ NOTE FLOW                           │
└──────────────────────────────────────────────────────────────┘

DATABASE                   SERVER                   NETWORK                   CLIENT
--------                   ------                   -------                   ------

"DeF456uVw..."  ──────→  "DeF456uVw..."
                              ↓
                         [AES Decrypt]
                         Master Key
                              ↓
                         "My Secret"
                         (plaintext in
                          memory ~1ms)
                              ↓
                         [RSA Encrypt]
                         Client Pub Key
                              ↓
                         "GhI789oPq..."  ────────→  "GhI789oPq..."
                                          HTTPS          ↓
                                                    [RSA Decrypt]
                                                    Client Priv Key
                                                         ↓
                                                    "My Secret"
```

---

## Detailed Step-by-Step Flow

### Creating a Note

#### Step 1: Client-Side Encryption (Transport Layer)
```javascript
// User types in browser
const plaintext = "My secret password is 12345";

// Encrypt with SERVER's public key (RSA)
const rsaEncrypted = await encryptWithPublicKey(plaintext, serverPublicKey);
// Result: "aBc123XyZ..." (Base64)

// Send over HTTPS
fetch('/api/notes', {
    headers: { 'X-Session-Id': sessionId },
    body: JSON.stringify({ encryptedContent: rsaEncrypted })
});
```

#### Step 2: Server Receives & Decrypts (Transport Layer)
```csharp
// Controller receives RSA-encrypted data
[HttpPost]
public async Task<IActionResult> Create([FromBody] CreateNoteDto dto)
{
    // dto.EncryptedContent = "aBc123XyZ..."
    
    // Get session to access server's private key
    var session = await _sessionService.GetActiveSessionAsync(userId, sessionId);
    
    // Decrypt RSA layer (transport)
    var serverPrivateKey = DecryptServerPrivateKey(session);
    var plaintext = _rsaEncryption.Decrypt(dto.EncryptedContent, serverPrivateKey);
    // plaintext = "My secret password is 12345"
    
    // Pass plaintext to service
    var note = await _noteService.CreateAsync(new CreateNoteDto {
        EncryptedContent = plaintext  // Actually plaintext now!
    }, userId);
}
```

#### Step 3: Server Encrypts for Storage (Storage Layer)
```csharp
// Service receives plaintext
public async Task<NoteDto> CreateAsync(CreateNoteDto dto, string userId)
{
    // dto.EncryptedContent is actually PLAINTEXT from controller
    var plaintext = dto.EncryptedContent;  // "My secret password is 12345"
    
    // Encrypt with AES for database
    var aesEncrypted = _aesEncryption.EncryptForStorage(plaintext);
    // aesEncrypted = "DeF456uVw..."
    
    // Save to database
    var note = new Note {
        EncryptedContent = aesEncrypted  // "DeF456uVw..."
    };
    await _db.SaveChangesAsync();
}
```

#### Step 4: Database Stores Encrypted Data
```sql
-- What's actually in the database
INSERT INTO Notes (EncryptedContent) VALUES ('DeF456uVw...');

-- CANNOT be decrypted without application's master key
-- Even if someone steals the database, data is protected
```

---

### Reading a Note

#### Step 1: Database Returns Encrypted Data
```sql
SELECT EncryptedContent FROM Notes WHERE Id = '...';
-- Returns: "DeF456uVw..."
```

#### Step 2: Server Decrypts from Storage (Storage Layer)
```csharp
// Service retrieves from database
public async Task<NoteDto> GetByIdAsync(Guid id, string userId)
{
    var note = await _db.Notes.FindAsync(id);
    // note.EncryptedContent = "DeF456uVw..."
    
    // Decrypt AES layer (storage)
    var plaintext = _aesEncryption.DecryptFromStorage(note.EncryptedContent);
    // plaintext = "My secret password is 12345"
    
    // Return plaintext to controller
    return new NoteDto {
        EncryptedContent = plaintext  // Plaintext!
    };
}
```

#### Step 3: Server Encrypts for Transport (Transport Layer)
```csharp
// Controller prepares response
[HttpGet("{id}")]
public async Task<IActionResult> GetById(Guid id)
{
    // Get plaintext from service
    var note = await _noteService.GetByIdAsync(id, userId);
    // note.EncryptedContent = "My secret password is 12345" (plaintext)
    
    // Get session to access client's public key
    var session = await _sessionService.GetActiveSessionAsync(userId, sessionId);
    
    // Encrypt with RSA for transport
    var rsaEncrypted = _rsaEncryption.Encrypt(note.EncryptedContent, session.ClientPublicKey);
    // rsaEncrypted = "GhI789oPq..."
    
    // Send to client
    return Ok(new NoteDto {
        EncryptedContent = rsaEncrypted  // "GhI789oPq..."
    });
}
```

#### Step 4: Client Decrypts (Transport Layer)
```javascript
// Client receives encrypted data
const response = await fetch('/api/notes/123', {
    headers: { 'X-Session-Id': sessionId }
});
const data = await response.json();
// data.encryptedContent = "GhI789oPq..."

// Decrypt with CLIENT's private key (RSA)
const plaintext = await decryptWithPrivateKey(data.encryptedContent, clientPrivateKey);
// plaintext = "My secret password is 12345"

// Display to user
document.getElementById('note').value = plaintext;
```

---

## Key Management

### RSA Keys (Transport Layer)

**Server Key Pair:**
- Generated: On each login (new session)
- Lifetime: 24 hours
- Storage: Database (private key encrypted with master key)
- Purpose: Decrypt data from client

**Client Key Pair:**
- Generated: In browser on login
- Lifetime: Until logout or page refresh
- Storage: Browser memory (never sent to server)
- Purpose: Decrypt data from server

**Key Exchange (Handshake):**
```
1. User logs in
2. Server generates RSA key pair
3. Server sends public key to client
4. Client generates RSA key pair
5. Client sends public key to server
6. Both parties can now encrypt for each other
```

### AES Key (Storage Layer)

**Master Key:**
- Generated: Once, manually (32 bytes for AES-256)
- Lifetime: Permanent (until rotated)
- Storage: appsettings.json or Key Vault
- Purpose: Encrypt/decrypt ALL data in database

**Configuration:**
```json
{
  "Encryption": {
    "MasterKey": "ThisIsASecureMasterKey32Bytes!!",
    "MasterIV": "ThisIsSecureIV16"
  }
}
```

**Production:** Use Azure Key Vault, AWS KMS, or HashiCorp Vault!

---

## Security Analysis

### Attack Scenarios

**Scenario 1: Network Interception**
```
Attacker intercepts: "aBc123XyZ..." (RSA encrypted)
Can they decrypt? NO - requires server's private key
Protection: RSA encryption (transport layer)
```

**Scenario 2: Database Breach**
```
Attacker steals DB: "DeF456uVw..." (AES encrypted)
Can they decrypt? NO - requires master key from config
Protection: AES encryption (storage layer)
```

**Scenario 3: Server Memory Dump**
```
Attacker dumps memory: Might find "My secret password is 12345"
Can they get all data? NO - plaintext exists for ~1ms during processing
Protection: Minimal plaintext exposure time
```

**Scenario 4: Client Compromise**
```
Attacker hacks browser: Gets client's private key
Can they decrypt ALL data? NO - only that session's data
Protection: Session-based keys, expire after 24 hours
```

---

## Code Examples

### Client-Side (JavaScript)

```javascript
// Initialize client
const client = new SecureNotesClient('https://localhost:7000');

// Login (auto-initiates handshake)
await client.login('user@example.com', 'password');
// client.sessionId is now set
// client.serverPublicKey is now available

// Create note
const title = "My Secret Note";
const content = "Secret content here";

// Client automatically:
// 1. Encrypts with server's public key (RSA)
// 2. Sends encrypted data
const note = await client.createNote(title, content);

// Get notes
// Client automatically:
// 1. Receives RSA-encrypted data
// 2. Decrypts with own private key
const notes = await client.getAllNotes();
console.log(notes[0].title); // "My Secret Note" (decrypted!)
```

### Server-Side (C#)

**Controller (Handles RSA - Transport Layer):**
```csharp
[HttpPost]
public async Task<IActionResult> Create(
    [FromBody] CreateNoteDto dto,
    [FromHeader(Name = "X-Session-Id")] Guid sessionId)
{
    // 1. Get session for RSA keys
    var session = await _sessionService.GetActiveSessionAsync(userId, sessionId);
    
    // 2. Decrypt RSA layer (transport)
    var serverPrivateKey = GetServerPrivateKey(session);
    var plaintext = _rsaEncryption.Decrypt(dto.EncryptedContent, serverPrivateKey);
    
    // 3. Pass plaintext to service (which will apply AES)
    var note = await _noteService.CreateAsync(new CreateNoteDto {
        EncryptedContent = plaintext
    }, userId);
    
    // 4. Encrypt response with RSA for client
    note.EncryptedContent = _rsaEncryption.Encrypt(
        note.EncryptedContent,
        session.ClientPublicKey
    );
    
    return Ok(note);
}
```

**Service (Handles AES - Storage Layer):**
```csharp
public async Task<NoteDto> CreateAsync(CreateNoteDto dto, string userId)
{
    // dto.EncryptedContent is PLAINTEXT from controller
    
    // 1. Encrypt with AES for database
    var aesEncrypted = _aesEncryption.EncryptForStorage(dto.EncryptedContent);
    
    // 2. Save to database
    var note = new Note {
        EncryptedContent = aesEncrypted
    };
    await _db.SaveChangesAsync();
    
    // 3. Return plaintext (controller will handle RSA encryption)
    return new NoteDto {
        EncryptedContent = dto.EncryptedContent  // Return plaintext
    };
}
```

---

## Summary

**Data States:**
1. **Client Memory:** Plaintext
2. **Network (Client→Server):** RSA encrypted with server's public key
3. **Server Memory:** Plaintext (~1ms during processing)
4. **Database:** AES encrypted with master key
5. **Server Memory:** Plaintext (~1ms during processing)
6. **Network (Server→Client):** RSA encrypted with client's public key
7. **Client Memory:** Plaintext

**Key Insight:**
- RSA keys change every session (24 hours)
- AES key is constant (but should be rotated periodically)
- Plaintext only exists briefly in server memory
- No plaintext in network or database
