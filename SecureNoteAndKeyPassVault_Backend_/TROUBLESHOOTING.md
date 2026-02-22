# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### ❌ "Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded"

**Cause:** The PEM key from the server contains invalid Base64 characters or improper formatting.

**Solutions:**

1. **Clear Browser Cache and Reload**
   - Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
   - This ensures you're using the latest JavaScript client

2. **Check CORS Configuration**
   - Make sure the API is running at `https://localhost:7000`
   - Open browser console (F12) and check for CORS errors
   - The API already has CORS enabled for all origins

3. **Verify API is Running**
   ```bash
   # Check if API is running
   curl https://localhost:7000/swagger/index.html
   ```

4. **Test Local Encryption First**
   - Click the "🧪 Test Local Encryption" button in example.html
   - This tests RSA without the server
   - If this fails, check browser console for Web Crypto API errors

5. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look at Console tab for detailed error messages
   - The updated client now logs each step of the handshake

**Debug Steps:**

```javascript
// Open browser console and run:

// 1. Test local encryption
await client.testLocalEncryption();

// 2. If that works, try handshake with detailed logging
await client.performHandshake();
// Check console for step-by-step output
```

---

### ❌ "Failed to initiate handshake" / 401 Unauthorized

**Cause:** JWT token is missing, expired, or invalid.

**Solution:**

1. Login first before attempting handshake:
   ```javascript
   await client.login('user@example.com', 'Password123!');
   await client.performHandshake(); // Now it will work
   ```

2. Check if token is being set:
   ```javascript
   console.log('Token:', client.authToken);
   // Should show a long JWT string
   ```

3. Token expires after 12 hours - login again if needed

---

### ❌ CORS Error: "Access to fetch has been blocked by CORS policy"

**Cause:** API not running or CORS not properly configured.

**Solutions:**

1. **Ensure API is Running**
   ```bash
   cd SecureNotesAPI
   dotnet run
   ```

2. **Check API URL in JavaScript**
   In `example.html`, verify the URL matches your API:
   ```javascript
   const client = new SecureNotesClient('https://localhost:7000');
   // Change port if your API uses different port
   ```

3. **Run example.html from a Web Server**
   Opening the HTML file directly (`file://`) may cause issues.
   
   Use a local server:
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx http-server -p 8000
   
   # Then open: http://localhost:8000/example.html
   ```

---

### ❌ "Session not found" / "Invalid session"

**Cause:** Session expired (>24 hours) or was invalidated.

**Solution:**

1. Perform handshake again:
   ```javascript
   await client.performHandshake();
   ```

2. Sessions expire after 24 hours by default
3. Change expiration in `RsaSessionService.cs` if needed:
   ```csharp
   ExpiresAt = DateTime.UtcNow.AddHours(48) // 48 hours
   ```

---

### ❌ HTTPS Certificate Errors in Development

**Cause:** Self-signed certificate not trusted.

**Solutions:**

1. **Trust the Development Certificate**
   ```bash
   dotnet dev-certs https --trust
   ```

2. **Or Use HTTP** (not recommended for production)
   Change in `example.html`:
   ```javascript
   const client = new SecureNotesClient('http://localhost:5000');
   ```

---

### ❌ "Database is locked" Error

**Cause:** SQLite database is being accessed by another process.

**Solutions:**

1. Stop all running instances of the API
2. Delete `securenotesdb.db` and restart (will recreate database)
3. Or use a different database connection string in `appsettings.json`

---

### ❌ Notes/Passwords Return Encrypted Data Instead of Plain Text

**Cause:** Data is being retrieved but not decrypted by the client.

**Solution:**

This is expected behavior! The JavaScript client should decrypt it automatically:

```javascript
// ✓ Correct - using client methods (auto-decrypts)
const notes = await client.getAllNotes();
console.log(notes[0].title); // Decrypted!

// ✗ Wrong - calling API directly (returns encrypted)
const response = await fetch('/api/notes');
const notes = await response.json();
console.log(notes[0].encryptedTitle); // Still encrypted!
```

Always use the `SecureNotesClient` methods, not direct fetch calls.

---

### ❌ "Handshake must be completed first" Error

**Cause:** Trying to create/read notes before establishing encrypted session.

**Solution:**

Always follow this order:
```javascript
// 1. Login
await client.login('user@example.com', 'Password123!');

// 2. Handshake (establishes encryption)
await client.performHandshake();

// 3. Now you can use notes/passwords
await client.createNote('Title', 'Content');
```

---

### ❌ Migration/Database Errors on Startup

**Cause:** Database schema issues or missing migrations.

**Solutions:**

1. **Delete and Recreate Database**
   ```bash
   rm securenotesdb.db
   dotnet run
   # Database will be auto-created
   ```

2. **Or Apply Migrations Manually**
   ```bash
   dotnet ef database update
   ```

---

## Testing Checklist

Use this checklist to verify everything is working:

- [ ] API runs without errors: `dotnet run`
- [ ] Swagger UI loads: `https://localhost:7000/swagger`
- [ ] Can register a user via Swagger or HTML
- [ ] Can login and receive JWT token
- [ ] Local encryption test passes (🧪 button)
- [ ] Handshake completes successfully
- [ ] Can create a note
- [ ] Can retrieve and decrypt notes
- [ ] Can create a password entry
- [ ] Can retrieve and decrypt passwords

---

## Debug Mode

### Enable Detailed Logging

The updated `SecureNotesClient.js` now includes console logging. Open browser console (F12) to see:

```
✓ Client key pair generated
✓ Received server public key
Server Public Key (first 100 chars): -----BEGIN PUBLIC KEY-----...
✓ Server public key imported successfully
✓ Client public key exported to PEM
Client Public Key (first 100 chars): -----BEGIN PUBLIC KEY-----...
✓ Handshake completed successfully
```

### Test Each Component Separately

```javascript
// 1. Test local encryption (no server needed)
await client.testLocalEncryption();

// 2. Test authentication
await client.login('user@example.com', 'Password123!');
console.log('Token:', client.authToken ? 'OK' : 'FAILED');

// 3. Test handshake initiation
const initResult = await client.initiateHandshake();
console.log('Session ID:', initResult.sessionId);
console.log('Server Key:', initResult.serverPublicKey.substring(0, 50));

// 4. Test handshake completion
const completeResult = await client.completeHandshake();
console.log('Complete:', completeResult);

// 5. Test encryption with server key
const encrypted = await client.encryptForServer('test message');
console.log('Encrypted:', encrypted.substring(0, 50));
```

---

## Still Having Issues?

1. **Check all console logs** - Browser console (F12) will show detailed errors
2. **Verify API logs** - Check the terminal where `dotnet run` is running
3. **Test with Swagger first** - Verify API works independently of JavaScript
4. **Try different browser** - Some browsers have stricter security policies
5. **Check firewall/antivirus** - May be blocking localhost connections

---

## Quick Fix Commands

```bash
# Reset everything
rm securenotesdb.db
dotnet clean
dotnet build
dotnet run

# In browser console
client.logout();
await client.testLocalEncryption();
await client.login('user@example.com', 'Password123!');
await client.performHandshake();
```

---

## API Endpoints Health Check

Test each endpoint manually:

```bash
# 1. Health check
curl https://localhost:7000/swagger/index.html

# 2. Register
curl -X POST https://localhost:7000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","confirmPassword":"Test123!"}'

# 3. Login
curl -X POST https://localhost:7000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# 4. Initiate handshake (requires token from step 3)
curl -X POST https://localhost:7000/api/auth/handshake/initiate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

If these work via curl/Postman but not via JavaScript, the issue is in the client code or CORS.
