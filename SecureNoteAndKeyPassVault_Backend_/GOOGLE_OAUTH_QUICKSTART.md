# 🚀 Google OAuth - Quick Reference Card

## ⚡ Quick Setup (5 Minutes)

### 1. Get Google Client ID
```
1. Visit: https://console.cloud.google.com/
2. Create project → Enable Google+ API
3. Create OAuth Client ID (Web application)
4. Copy Client ID: "123456789-abc.apps.googleusercontent.com"
```

### 2. Configure Backend
**File:** `appsettings.json`
```json
{
  "Google": {
    "ClientId": "YOUR_CLIENT_ID.apps.googleusercontent.com"
  }
}
```

### 3. Configure Frontend
**File:** `example.html` (replace in 2 places)
```html
<!-- Line 4 -->
<meta name="google-signin-client_id" content="YOUR_CLIENT_ID.apps.googleusercontent.com">

<!-- Line 38 -->
<div id="g_id_onload" data-client_id="YOUR_CLIENT_ID.apps.googleusercontent.com">
```

### 4. Run & Test
```bash
dotnet run
# Visit: http://localhost:8000/example.html
# Click "Sign in with Google" ✅
```

---

## 📋 Files Changed

| File | Purpose |
|------|---------|
| `AuthController.cs` | Added `/api/auth/google-login` endpoint |
| `GoogleAuthService.cs` | Validates Google ID tokens |
| `SecureNotesClient.js` | Added `googleLogin()` method |
| `example.html` | Added Google Sign-In button |
| `appsettings.json` | Added Google ClientId config |
| `GOOGLE_OAUTH_SETUP.md` | Full setup guide |

---

## 🔐 How It Works

```
User clicks "Sign in with Google"
    ↓
Google authenticates user
    ↓
Returns ID Token to browser
    ↓
Browser sends token to our API: POST /api/auth/google-login
    ↓
API validates token with Google
    ↓
API creates/finds user
    ↓
API returns JWT + Handshake data
    ↓
Client auto-completes handshake
    ↓
✅ Ready to use encrypted notes!
```

---

## 💻 Code Examples

### JavaScript (Client)
```javascript
// Google handles the sign-in flow automatically
// Just implement the callback:

async function handleGoogleSignIn(response) {
    // response.credential = Google ID token
    const result = await client.googleLogin(response.credential);
    
    // Auto-handshake
    client.sessionId = result.handshake.sessionId;
    await completeHandshake();
    
    console.log('Signed in as:', result.email);
}
```

### C# (Server)
```csharp
[HttpPost("google-login")]
public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
{
    // Validate Google token
    var payload = await _googleAuthService.ValidateGoogleTokenAsync(dto.IdToken);
    
    // Create/find user
    var user = await _userManager.FindByEmailAsync(payload.Email);
    
    // Generate JWT + Handshake
    return Ok(new { token, handshake });
}
```

---

## ✅ Features

- ✅ **One-Click Login** - No registration needed
- ✅ **Auto-Create Account** - First-time users auto-registered
- ✅ **Email Verified** - Google verifies emails
- ✅ **Auto-Handshake** - RSA session starts automatically
- ✅ **Secure** - No password storage
- ✅ **Fast** - Login in ~2 seconds

---

## 🐛 Common Issues

**Button not showing?**
- Check Client ID in HTML (2 places)
- Check Google script loaded: `<script src="https://accounts.google.com/gsi/client">`

**"Invalid token" error?**
- Verify Client ID matches in backend and frontend
- Check authorized origins in Google Console

**CORS error?**
- Add `http://localhost:8000` to authorized origins in Google Console

---

## 📚 Full Documentation

See `GOOGLE_OAUTH_SETUP.md` for complete guide including:
- Step-by-step Google Console setup
- Production deployment checklist
- Security best practices
- Troubleshooting guide

---

## 🎯 Testing Checklist

- [ ] Google button appears in HTML
- [ ] Click opens Google sign-in popup
- [ ] Select account and sign in
- [ ] See success message with email
- [ ] Auto-handshake completes
- [ ] Can create encrypted notes
- [ ] Sign out and sign in again works

---

**Need help?** Check `GOOGLE_OAUTH_SETUP.md` for detailed instructions!
