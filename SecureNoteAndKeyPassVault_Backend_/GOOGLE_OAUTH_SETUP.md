# 🔐 Google OAuth2 Setup Guide

## Overview

This application supports both traditional email/password authentication and Google OAuth2 login. This guide will help you set up Google Sign-In.

---

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project**
   - Click "Select a project" → "New Project"
   - Name: `Secure Notes API` (or your preferred name)
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

---

## Step 2: Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - Navigate to "APIs & Services" → "Credentials"

2. **Configure OAuth Consent Screen**
   - Click "Configure Consent Screen"
   - Choose "External" (or "Internal" if using Google Workspace)
   - Fill in required fields:
     - App name: `Secure Notes`
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - Skip "Scopes" (click "Save and Continue")
   - Add test users if needed
   - Click "Save and Continue"

3. **Create OAuth Client ID**
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: `Secure Notes Web Client`
   
   - **Authorized JavaScript origins:**
     ```
     http://localhost:8000
     http://localhost:3000
     https://yourdomain.com
     ```
   
   - **Authorized redirect URIs:**
     ```
     http://localhost:8000
     https://yourdomain.com
     ```
   
   - Click "Create"

4. **Copy Your Credentials**
   - You'll see a dialog with:
     - Client ID: `123456789-abcdef.apps.googleusercontent.com`
     - Client Secret: (not needed for client-side flow)
   - **Save the Client ID** - you'll need it!

---

## Step 3: Configure the Application

### Backend Configuration

1. **Update `appsettings.json`**

```json
{
  "Google": {
    "ClientId": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com"
  }
}
```

Replace `YOUR_ACTUAL_CLIENT_ID` with your real Client ID from Step 2.

2. **Update `appsettings.Development.json`** (same as above)

### Frontend Configuration

1. **Update `example.html`**

Find these two locations and replace with your Client ID:

```html
<!-- In the <head> section -->
<meta name="google-signin-client_id" content="YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com">

<!-- In the body, Google Sign-In button -->
<div id="g_id_onload"
     data-client_id="YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com"
     ...>
</div>
```

---

## Step 4: Test the Integration

### Run the Application

1. **Start the API**
   ```bash
   cd SecureNotesAPI
   dotnet run
   ```

2. **Start a local web server for the HTML**
   ```bash
   cd ClientJS
   python -m http.server 8000
   # Or: npx http-server -p 8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000/example.html
   ```

### Test Google Sign-In

1. Click the "Sign in with Google" button
2. Choose your Google account
3. Grant permissions (first time only)
4. You should see:
   - ✅ Google Sign-In successful!
   - Email: your@gmail.com
   - Name: Your Name
   - ✅ Handshake completed automatically!

---

## How It Works

### Flow Diagram

```
┌──────────────┐
│   CLIENT     │
│  (Browser)   │
└──────────────┘
       ↓
   Click "Sign in with Google"
       ↓
┌──────────────┐
│   GOOGLE     │
│ Auth Server  │
└──────────────┘
       ↓
   User signs in
       ↓
   Returns ID Token (JWT)
       ↓
┌──────────────┐
│   CLIENT     │
└──────────────┘
       ↓
   Send ID Token to our API
       ↓
┌──────────────┐
│  OUR SERVER  │
└──────────────┘
       ↓
   Validate token with Google
       ↓
   Create/Find user in database
       ↓
   Generate JWT token
       ↓
   Initiate RSA handshake
       ↓
   Return: JWT + Handshake data
       ↓
┌──────────────┐
│   CLIENT     │
└──────────────┘
   ✅ Logged in!
   ✅ Encrypted session ready!
```

### Security Flow

1. **Client Side (Browser)**
   - Google Sign-In button loads
   - User clicks and authenticates with Google
   - Google returns ID Token (JWT) to browser
   - Client sends ID Token to our API

2. **Server Side (Our API)**
   - Receives ID Token
   - Validates with Google's servers
   - Extracts user info (email, name, etc.)
   - Creates new user if doesn't exist
   - Generates our own JWT token
   - Initiates RSA handshake automatically
   - Returns JWT + handshake data

3. **Client Side (Post-Login)**
   - Receives JWT token
   - Receives RSA session data
   - Automatically completes handshake
   - Ready to create encrypted notes!

---

## API Endpoint

### POST `/api/auth/google-login`

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjU5N..."
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@gmail.com",
  "name": "John Doe",
  "expiration": "2024-01-02T12:00:00Z",
  "handshake": {
    "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serverPublicKey": "-----BEGIN PUBLIC KEY-----\n..."
  },
  "isNewUser": true
}
```

---

## JavaScript Usage

```javascript
// Initialize client
const client = new SecureNotesClient('https://localhost:7000');

// Google Sign-In happens via button click
// The handleGoogleSignIn function is called automatically

async function handleGoogleSignIn(response) {
    // response.credential contains the Google ID token
    
    // Login with Google
    const result = await client.googleLogin(response.credential);
    
    // Auto-complete handshake
    client.sessionId = result.handshake.sessionId;
    client.serverPublicKey = await client.importPublicKeyFromPem(
        result.handshake.serverPublicKey
    );
    await client.generateClientKeyPair();
    await client.completeHandshake();
    
    // Ready to use!
    console.log('Logged in as:', result.email);
}
```

---

## Troubleshooting

### "Invalid Google token" Error

**Cause:** Client ID mismatch or invalid token

**Solutions:**
1. Verify Client ID in `appsettings.json` matches Google Console
2. Verify Client ID in `example.html` matches Google Console
3. Check authorized origins in Google Console include your domain
4. Clear browser cache and cookies
5. Make sure you're using HTTPS in production (localhost OK for dev)

### Google Sign-In Button Not Showing

**Cause:** Script not loaded or Client ID incorrect

**Solutions:**
1. Check browser console for errors
2. Verify `<script src="https://accounts.google.com/gsi/client">` is in `<head>`
3. Verify Client ID in meta tag and div are correct
4. Check network tab to see if Google's script loaded

### "User creation failed" Error

**Cause:** Database or Identity configuration issue

**Solutions:**
1. Check database is accessible
2. Verify migrations are applied: `dotnet ef database update`
3. Check server logs for detailed error message

### CORS Errors

**Cause:** Authorized origins not configured in Google Console

**Solutions:**
1. Add your domain to "Authorized JavaScript origins"
2. Add redirect URIs to "Authorized redirect URIs"
3. Wait a few minutes for changes to propagate

---

## Production Deployment

### Security Checklist

- [ ] Use HTTPS only (no HTTP)
- [ ] Set proper authorized origins in Google Console
- [ ] Store Client ID in environment variables (not in code)
- [ ] Enable email verification if required
- [ ] Set up proper CORS policies
- [ ] Monitor failed login attempts
- [ ] Implement rate limiting

### Environment Variables

Instead of hardcoding in `appsettings.json`:

```bash
# Linux/Mac
export Google__ClientId="YOUR_CLIENT_ID.apps.googleusercontent.com"

# Windows
set Google__ClientId=YOUR_CLIENT_ID.apps.googleusercontent.com

# Docker
docker run -e Google__ClientId="YOUR_CLIENT_ID" ...
```

---

## Benefits of Google OAuth

✅ **No Password Management**
- Users don't need to remember another password
- No password reset flows needed
- Google handles 2FA, account recovery, etc.

✅ **Faster Registration**
- One-click sign-up
- Email automatically verified
- User info (name, email) pre-filled

✅ **Better Security**
- Leverages Google's security infrastructure
- No storing passwords in our database
- Reduced attack surface

✅ **Better UX**
- Familiar "Sign in with Google" button
- Works across devices if user is signed into Google
- Single sign-on experience

---

## Additional Resources

- **Google Identity Documentation:** https://developers.google.com/identity
- **OAuth 2.0 Playground:** https://developers.google.com/oauthplayground
- **Google Sign-In for Web:** https://developers.google.com/identity/gsi/web

---

## Summary

1. Create Google Cloud project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Copy Client ID
5. Update `appsettings.json` with Client ID
6. Update `example.html` with Client ID (2 places)
7. Run and test!

🎉 **You're all set!** Users can now sign in with Google and enjoy encrypted note-taking!
