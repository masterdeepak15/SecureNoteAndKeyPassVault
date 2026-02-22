# 🔐 Session Management & Security

## Overview

This application implements comprehensive session management with multi-device tracking, activity monitoring, and automatic cleanup. Each login creates a tracked session that can be managed independently.

---

## Features

### ✅ Multi-Device Session Tracking
- View all active login sessions
- See device information (browser, OS, device type)
- Track IP address and location (if available)
- Know which session is current
- Monitor last activity time

### ✅ Session Control
- Logout from specific devices
- Logout from all other devices (keep current)
- Logout from all devices (global logout)
- Automatic session cleanup

### ✅ Security Features
- **Heartbeat mechanism** - Keeps session alive with activity
- **Inactivity timeout** - Auto-logout after 30 minutes of inactivity
- **Absolute timeout** - Token expires after 12 hours regardless of activity
- **Token revocation** - Prevents use of stolen tokens
- **Background cleanup** - Removes expired sessions every 5 minutes

---

## Session Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    LOGIN                                │
├─────────────────────────────────────────────────────────┤
│ 1. User logs in (email/password or Google)             │
│ 2. Server creates session with device info             │
│ 3. JWT token generated with SessionId claim            │
│ 4. Client receives token + sessionId                   │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│                 ACTIVE SESSION                          │
├─────────────────────────────────────────────────────────┤
│ • Client sends heartbeat every 2-5 minutes             │
│ • Each heartbeat updates LastActivityAt                │
│ • Session remains valid while active                   │
│                                                         │
│ Timeout Conditions:                                    │
│ • 30 min inactivity → Session expires                  │
│ • 12 hours absolute → Token expires                    │
│ • User logout → Session revoked                        │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│                SESSION EXPIRED                          │
├─────────────────────────────────────────────────────────┤
│ • IsActive = false                                     │
│ • User must login again                                │
│ • Background service cleans up (every 5 min)          │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### 1. Get Active Sessions

```http
GET /api/sessions
Authorization: Bearer {token}
```

**Response:**
```json
{
  "activeSessions": [
    {
      "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "ipAddress": "192.168.1.100",
      "browser": "Chrome 120.0",
      "operatingSystem": "Windows 10/11",
      "deviceType": "Desktop",
      "location": null,
      "createdAt": "2024-01-01T10:00:00Z",
      "lastActivityAt": "2024-01-01T10:45:00Z",
      "expiresAt": "2024-01-01T22:00:00Z",
      "isCurrentSession": true
    },
    {
      "sessionId": "8d1e7780-8536-51f3-c4ed-3d074g77bfb8",
      "ipAddress": "10.0.0.50",
      "browser": "Safari 17.0",
      "operatingSystem": "iOS 17.2",
      "deviceType": "Mobile",
      "location": null,
      "createdAt": "2023-12-31T20:00:00Z",
      "lastActivityAt": "2024-01-01T09:00:00Z",
      "expiresAt": "2024-01-01T08:00:00Z",
      "isCurrentSession": false
    }
  ],
  "totalSessions": 2,
  "currentSessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

### 2. Heartbeat (Keep Alive)

```http
POST /api/sessions/heartbeat
Authorization: Bearer {token}
Content-Type: application/json

{
  "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Response (Session Valid):**
```json
{
  "isValid": true,
  "lastActivityAt": "2024-01-01T10:45:00Z",
  "expiresAt": "2024-01-01T22:00:00Z",
  "newToken": null
}
```

**Response (Session Expired):**
```json
{
  "isValid": false,
  "lastActivityAt": "2024-01-01T09:00:00Z",
  "expiresAt": "2024-01-01T21:00:00Z",
  "newToken": null
}
```

### 3. Revoke Specific Session

```http
DELETE /api/sessions/{sessionId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Session revoked successfully"
}
```

### 4. Logout from All Other Devices

```http
POST /api/sessions/revoke-others
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Logged out from 3 other device(s)",
  "revokedSessions": 3
}
```

### 5. Logout from All Devices

```http
POST /api/sessions/revoke-all
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Logged out from all 4 device(s)",
  "revokedSessions": 4
}
```

### 6. Validate Current Session

```http
GET /api/sessions/validate
Authorization: Bearer {token}
```

**Response:**
```json
{
  "isValid": true,
  "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "message": "Session is valid"
}
```

---

## Client Implementation

### JavaScript Client

```javascript
class SessionManager {
  constructor(apiBaseUrl, authToken, sessionId) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
    this.sessionId = sessionId;
    this.heartbeatInterval = null;
  }

  // Start heartbeat (call after login)
  startHeartbeat() {
    // Send heartbeat every 3 minutes
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 3 * 60 * 1000); // 3 minutes

    // Send immediate heartbeat
    this.sendHeartbeat();
  }

  // Stop heartbeat (call on logout)
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Send heartbeat to keep session alive
  async sendHeartbeat() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/sessions/heartbeat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId
        })
      });

      const data = await response.json();

      if (!data.isValid) {
        // Session expired - redirect to login
        this.stopHeartbeat();
        window.location.href = '/login?reason=session-expired';
      }
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }

  // Get all active sessions
  async getActiveSessions() {
    const response = await fetch(`${this.apiBaseUrl}/api/sessions`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    return await response.json();
  }

  // Logout from specific device
  async logoutDevice(sessionId) {
    const response = await fetch(`${this.apiBaseUrl}/api/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    return await response.json();
  }

  // Logout from all other devices
  async logoutOtherDevices() {
    const response = await fetch(`${this.apiBaseUrl}/api/sessions/revoke-others`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    return await response.json();
  }

  // Logout from all devices
  async logoutAllDevices() {
    const response = await fetch(`${this.apiBaseUrl}/api/sessions/revoke-all`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    this.stopHeartbeat();
    return await response.json();
  }
}

// Usage
const sessionManager = new SessionManager(apiUrl, token, sessionId);

// Start heartbeat after login
sessionManager.startHeartbeat();

// View sessions
const sessions = await sessionManager.getActiveSessions();
console.log('Active sessions:', sessions);

// Logout from specific device
await sessionManager.logoutDevice('session-id-here');

// Logout from all other devices
await sessionManager.logoutOtherDevices();
```

---

## Session Data Captured

### Automatically Detected (No Third-Party APIs)

**IP Address:**
- Source: `HttpContext.Connection.RemoteIpAddress`
- Example: `192.168.1.100`, `10.0.0.50`

**Browser:**
- Source: User-Agent parsing
- Examples:
  - `Chrome 120.0`
  - `Firefox 121.0`
  - `Safari 17.0`
  - `Edge 120.0`

**Operating System:**
- Source: User-Agent parsing
- Examples:
  - `Windows 10/11`
  - `macOS 14.2`
  - `iOS 17.2`
  - `Android 14.0`
  - `Linux`
  - `Ubuntu`

**Device Type:**
- Source: User-Agent parsing
- Values:
  - `Desktop`
  - `Mobile`
  - `Tablet`

**User-Agent String:**
- Full browser identification string
- Example: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`

---

## Security Timeouts

### Inactivity Timeout: 30 Minutes
- If no heartbeat received for 30 minutes, session expires
- User must login again
- Prevents abandoned sessions from staying active

### Absolute Timeout: 12 Hours
- Token expires after 12 hours regardless of activity
- User must login again
- Prevents indefinitely valid tokens

### Heartbeat Interval: 2-5 Minutes
- Client should send heartbeat every 2-5 minutes
- Recommended: 3 minutes
- Updates `LastActivityAt` timestamp

---

## Background Cleanup

### Automatic Cleanup Service
- Runs every 5 minutes
- Finds sessions that are:
  - Expired (past ExpiresAt)
  - Inactive (no activity for 30+ minutes)
- Sets `IsActive = false`
- Sets `IsRevoked = true`
- Cleans up database

```csharp
// Runs automatically in background
public class SessionCleanupService : BackgroundService
{
    // Runs every 5 minutes
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromMinutes(5);
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await CleanupExpiredSessionsAsync();
            await Task.Delay(_cleanupInterval, stoppingToken);
        }
    }
}
```

---

## UI Implementation Guide

### Sessions Page Layout

```
┌─────────────────────────────────────────────────────────┐
│                   Active Sessions (3)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 🖥️ Windows 10/11 • Chrome 120.0          [You] │   │
│ │ 192.168.1.100                                   │   │
│ │ Last active: 2 minutes ago                      │   │
│ │ Expires in: 11 hours                            │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 📱 iOS 17.2 • Safari 17.0            [Logout] │   │
│ │ 10.0.0.50                                       │   │
│ │ Last active: 45 minutes ago                     │   │
│ │ Expires in: 6 hours                             │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 💻 macOS 14.2 • Chrome 120.0         [Logout] │   │
│ │ 172.16.0.10                                     │   │
│ │ Last active: 3 hours ago                        │   │
│ │ Expires in: 2 hours                             │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ [Logout from All Other Devices]                        │
│ [Logout from All Devices]                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Features to Implement

**Session Card:**
- Device icon (desktop/mobile/tablet)
- OS + Browser name
- IP address
- Last activity (relative time: "2 minutes ago")
- Expiration time (relative: "Expires in 11 hours")
- "Current" badge for active session
- "Logout" button for other sessions

**Actions:**
- Individual logout (per session)
- "Logout from all other devices" button
- "Logout from all devices" button with confirmation
- Auto-refresh every 30 seconds to update "last active" times

---

## Security Best Practices

### ✅ Token Security
- Store token in memory or httpOnly cookie (not localStorage)
- Clear token on logout
- Validate token on every request
- Revoke token on suspicious activity

### ✅ Heartbeat Strategy
- Send heartbeat every 2-5 minutes
- Stop heartbeat on logout
- Handle heartbeat failure (session expired)
- Don't send sensitive data in heartbeat

### ✅ Multi-Device Management
- Show all active sessions to user
- Allow logout from specific devices
- Notify user of new logins (optional)
- Track unusual activity (multiple IPs, etc.)

### ✅ Session Expiration
- 30-minute inactivity timeout
- 12-hour absolute timeout
- Background cleanup every 5 minutes
- Immediate revocation on logout

---

## Monitoring & Alerts

### What to Monitor

1. **Active Sessions per User**
   - Alert if > 10 sessions (possible account sharing)
   
2. **Multiple IPs for Same User**
   - Alert if > 5 different IPs in 1 hour
   
3. **Failed Heartbeats**
   - Monitor heartbeat failure rate
   
4. **Expired Sessions**
   - Track cleanup statistics

### Sample Queries

```sql
-- Users with most active sessions
SELECT UserId, COUNT(*) as SessionCount
FROM UserSessions
WHERE IsActive = 1
GROUP BY UserId
ORDER BY SessionCount DESC;

-- Sessions expiring soon
SELECT *
FROM UserSessions
WHERE IsActive = 1
AND ExpiresAt < datetime('now', '+1 hour');

-- Inactive sessions (no activity in 20+ minutes)
SELECT *
FROM UserSessions
WHERE IsActive = 1
AND datetime('now') > datetime(LastActivityAt, '+20 minutes');
```

---

## Testing

### Manual Testing

1. **Login from Multiple Devices:**
   ```bash
   # Login from browser 1
   curl -X POST http://localhost:7000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"Password123!"}'
   
   # Login from browser 2
   # Use different User-Agent header
   ```

2. **View Active Sessions:**
   ```bash
   curl http://localhost:7000/api/sessions \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Send Heartbeat:**
   ```bash
   curl -X POST http://localhost:7000/api/sessions/heartbeat \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"YOUR_SESSION_ID"}'
   ```

4. **Logout Specific Device:**
   ```bash
   curl -X DELETE http://localhost:7000/api/sessions/SESSION_ID \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## Summary

This session management system provides:

✅ **Multi-device tracking** - See all login locations
✅ **Activity monitoring** - Know when last active
✅ **Remote logout** - Logout from any device
✅ **Auto-expiration** - 30-min inactivity, 12-hour max
✅ **Background cleanup** - Automatic maintenance
✅ **No third-party APIs** - All detection built-in
✅ **Security hardening** - Prevents token theft

Users have full control over their sessions across all devices!
