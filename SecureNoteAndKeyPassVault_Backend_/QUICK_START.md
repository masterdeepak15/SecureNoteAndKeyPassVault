# 🚀 Quick Start Guide

## Get Running in 5 Minutes

### Step 1: Navigate to Project
```bash
cd SecureNotesAPI
```

### Step 2: Restore Dependencies
```bash
dotnet restore
```

### Step 3: Run the Application
```bash
dotnet run
```

The API will start at `https://localhost:7000` (or http://localhost:5000)

### Step 4: Open Swagger UI
Navigate to: `https://localhost:7000/swagger`

### Step 5: Test with JavaScript Client

Open `ClientJS/example.html` in your browser (use a local web server):

```bash
# Option 1: Python
cd ClientJS
python -m http.server 8000

# Option 2: Node.js
npx http-server ClientJS -p 8000

# Then open: http://localhost:8000/example.html
```

**Important:** Update the API URL in example.html if using different port:
```javascript
const client = new SecureNotesClient('https://localhost:7000');
```

## Complete Workflow Example

### Using JavaScript Client (Easiest)

```javascript
// 1. Initialize
const client = new SecureNotesClient('https://localhost:7000');

// 2. Register
await client.register('user@example.com', 'Password123!', 'Password123!');

// 3. Login
await client.login('user@example.com', 'Password123!');

// 4. Perform Handshake (automatic RSA key exchange)
await client.performHandshake();

// 5. Create encrypted note (automatic encryption)
const note = await client.createNote('My Secret', 'This is encrypted!');

// 6. Get all notes (automatic decryption)
const notes = await client.getAllNotes();
console.log(notes); // See your decrypted notes!

// 7. Create password entry
const pwd = await client.createPasswordEntry(
    'GitHub',
    'myemail@example.com',
    'MySecurePassword123!',
    'https://github.com'
);

// 8. Get all passwords
const passwords = await client.getAllPasswordEntries();
console.log(passwords);
```

### Using Postman/cURL

See `TESTING_GUIDE.md` for detailed API testing instructions.

## Project Structure

```
SecureNotesAPI/
├── Controllers/           → API endpoints
├── Domain/Entities/       → Database models
├── Application/
│   ├── Interfaces/        → Service contracts
│   └── DTOs/              → Data transfer objects
├── Infrastructure/
│   ├── Services/          → Business logic
│   ├── Repositories/      → Data access
│   └── Data/              → Database context
├── ClientJS/              → JavaScript client
│   ├── SecureNotesClient.js
│   └── example.html
├── README.md              → Full documentation
├── TESTING_GUIDE.md       → API testing guide
└── SOLID_PRINCIPLES.md    → Architecture explanation
```

## Key Files

- **Program.cs** - Application entry point, DI configuration
- **appsettings.json** - Configuration (change JWT secret in production!)
- **SecureNotesClient.js** - Complete client-side encryption library
- **example.html** - Interactive demo of all features

## Features

✅ User registration & authentication (JWT)  
✅ RSA encryption handshake (like TCP handshake)  
✅ Encrypted notes (CRUD operations)  
✅ Password manager (KeePass-like features)  
✅ Zero plaintext storage  
✅ SOLID principles  
✅ SQLite database  
✅ Swagger UI documentation  
✅ JavaScript client with automatic encryption  

## Next Steps

1. Read `README.md` for complete documentation
2. Read `SOLID_PRINCIPLES.md` to understand the architecture
3. Read `TESTING_GUIDE.md` for API testing examples
4. Explore `Controllers/` to see API endpoints
5. Explore `ClientJS/SecureNotesClient.js` to see client implementation

## Common Issues

### Port Already in Use
Edit `Properties/launchSettings.json` to change port

### Database Not Created
The database auto-creates on first run. Check for `securenotesdb.db` file.

### HTTPS Certificate Errors in Development
```bash
dotnet dev-certs https --trust
```

### CORS Errors from Browser
Make sure API is running and CORS is enabled (already configured)

## Production Deployment

Before deploying to production:

1. Change JWT secret in `appsettings.json`
2. Use environment variables for secrets
3. Configure proper CORS policy
4. Enable HTTPS only
5. Set up proper logging
6. Configure rate limiting
7. Use production-grade key management (Azure Key Vault, etc.)

See `README.md` for full production checklist.

## Need Help?

- Check inline code comments
- Read the comprehensive `README.md`
- Review `SOLID_PRINCIPLES.md` for architecture
- Look at `TESTING_GUIDE.md` for examples

---

**You're all set! 🎉**

The API is ready to use with complete RSA encryption, just like you requested!
