# API Testing Guide

## Testing with Postman or cURL

### 1. Register a User

```bash
curl -X POST https://localhost:7000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "confirmPassword": "Test123!@#"
  }'
```

**Response:**
```json
{
  "message": "User created successfully"
}
```

### 2. Login

```bash
curl -X POST https://localhost:7000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "test@example.com",
  "expiration": "2024-01-01T12:00:00Z"
}
```

**Save the token for subsequent requests!**

### 3. Initiate RSA Handshake

```bash
curl -X POST https://localhost:7000/api/auth/handshake/initiate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "serverPublicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBg...\n-----END PUBLIC KEY-----"
}
```

### 4. Complete RSA Handshake

First, generate your client RSA key pair and export public key to PEM format.
Then send it to the server:

```bash
curl -X POST https://localhost:7000/api/auth/handshake/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "clientPublicKey": "-----BEGIN PUBLIC KEY-----\nYOUR_CLIENT_PUBLIC_KEY\n-----END PUBLIC KEY-----"
  }'
```

**Response:**
```json
{
  "message": "Handshake completed successfully"
}
```

### 5. Create Encrypted Note

**Important:** You must encrypt the title and content using the server's public key before sending!

```bash
curl -X POST https://localhost:7000/api/notes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "encryptedTitle": "BASE64_ENCRYPTED_TITLE",
    "encryptedContent": "BASE64_ENCRYPTED_CONTENT"
  }'
```

**Response:**
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "encryptedTitle": "BASE64_ENCRYPTED_TITLE",
  "encryptedContent": "BASE64_ENCRYPTED_CONTENT",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

### 6. Get All Notes

```bash
curl -X GET https://localhost:7000/api/notes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
[
  {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "encryptedTitle": "BASE64_ENCRYPTED_TITLE",
    "encryptedContent": "BASE64_ENCRYPTED_CONTENT",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
]
```

**Note:** You need to decrypt the title and content using your client's private key!

### 7. Update Note

```bash
curl -X PUT https://localhost:7000/api/notes/7c9e6679-7425-40de-944b-e07fc1f90ae7 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "encryptedTitle": "NEW_ENCRYPTED_TITLE",
    "encryptedContent": "NEW_ENCRYPTED_CONTENT"
  }'
```

### 8. Delete Note

```bash
curl -X DELETE https://localhost:7000/api/notes/7c9e6679-7425-40de-944b-e07fc1f90ae7 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:** `204 No Content`

### 9. Create Password Entry

```bash
curl -X POST https://localhost:7000/api/passwords \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "encryptedSiteName": "ENCRYPTED_GITHUB",
    "encryptedUsername": "ENCRYPTED_EMAIL",
    "encryptedPassword": "ENCRYPTED_PASSWORD",
    "encryptedUrl": "ENCRYPTED_URL",
    "encryptedServerIp": "ENCRYPTED_IP",
    "encryptedHostname": "ENCRYPTED_HOSTNAME",
    "encryptedNotes": "ENCRYPTED_NOTES"
  }'
```

### 10. Get All Password Entries

```bash
curl -X GET https://localhost:7000/api/passwords \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing Flow Summary

1. ✅ Register user
2. ✅ Login (get JWT token)
3. ✅ Initiate handshake (get server public key)
4. ✅ Generate client key pair
5. ✅ Complete handshake (send client public key)
6. ✅ Encrypt data with server public key
7. ✅ Create/update notes or passwords
8. ✅ Retrieve encrypted data
9. ✅ Decrypt with client private key

## Important Notes

### Encryption Flow
```
Client Side:
1. Generate RSA key pair (public + private)
2. Send public key to server
3. Receive server's public key
4. Encrypt data with server's public key
5. Send encrypted data to server
6. Receive encrypted response
7. Decrypt with own private key

Server Side:
1. Generate RSA key pair (public + private)
2. Send public key to client
3. Receive client's public key
4. Receive encrypted data from client
5. Decrypt with own private key
6. Process/store encrypted data
7. Encrypt response with client's public key
8. Send encrypted response
```

### Common Issues

**401 Unauthorized**
- Token expired or invalid
- Missing Authorization header
- Token not prefixed with "Bearer "

**400 Bad Request**
- Invalid handshake session
- Session expired (>24 hours)
- Malformed encrypted data

**404 Not Found**
- Resource doesn't exist
- User doesn't own the resource
- Resource was soft-deleted

## Using the JavaScript Client (Recommended)

Instead of manual encryption, use the provided JavaScript client:

```javascript
const client = new SecureNotesClient('https://localhost:7000');

// Login
await client.login('test@example.com', 'Test123!@#');

// Handshake (automatic encryption key exchange)
await client.performHandshake();

// Create note (automatic encryption)
const note = await client.createNote('My Title', 'My Content');

// Get all notes (automatic decryption)
const notes = await client.getAllNotes();
console.log(notes); // Decrypted data!
```

This handles all encryption/decryption automatically!
