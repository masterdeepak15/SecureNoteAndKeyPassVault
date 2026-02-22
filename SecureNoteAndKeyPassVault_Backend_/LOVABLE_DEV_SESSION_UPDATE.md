# Lovable.dev Update: Session Management & Security Features

## 🎯 Overview of New Features

Add comprehensive session management to the existing Secure Notes application. This includes multi-device tracking, heartbeat monitoring, and remote logout capabilities.

---

## 📋 New API Endpoints to Integrate

### Base URL
```
Production: https://api.yourdomain.com
Development: https://localhost:7000
```

---

## 1. Get Active Sessions

**Endpoint:**
```
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

**Notes:**
- Returns all active login sessions for the current user
- `isCurrentSession` indicates which session is the current one
- Times are in UTC ISO 8601 format

---

## 2. Heartbeat (Keep Session Alive)

**Endpoint:**
```
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

**Notes:**
- Call this endpoint every 2-5 minutes (recommended: 3 minutes)
- Updates `lastActivityAt` timestamp
- If `isValid` is false, redirect user to login
- Session expires after 30 minutes of inactivity

---

## 3. Revoke Specific Session (Logout Device)

**Endpoint:**
```
DELETE /api/sessions/{sessionId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Session revoked successfully"
}
```

**Response 404:**
```json
{
  "message": "Session not found"
}
```

**Notes:**
- Logs out from a specific device
- Cannot revoke your own current session (use regular logout)

---

## 4. Logout from All Other Devices

**Endpoint:**
```
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

**Notes:**
- Keeps current session active
- Logs out from all other devices
- Returns count of revoked sessions

---

## 5. Logout from All Devices

**Endpoint:**
```
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

**Notes:**
- Logs out from ALL devices including current
- User must login again after this
- Use for "I lost my device" scenario

---

## 6. Validate Current Session

**Endpoint:**
```
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

**Response (Expired):**
```json
{
  "isValid": false,
  "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "message": "Session expired or revoked"
}
```

---

## 📱 New Pages to Add

### 1. Sessions Management Page

**Route:** `/settings/sessions`

**Page Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Settings > Sessions                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Active Sessions (3)                                         │
│                                                             │
│ Manage all devices where you're currently logged in.       │
│ You can logout from any device remotely for security.      │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🖥️ Windows 10/11                            [You]   │   │
│ │ Chrome 120.0 • Desktop                              │   │
│ │                                                     │   │
│ │ 📍 IP: 192.168.1.100                               │   │
│ │ 🕐 Last active: 2 minutes ago                      │   │
│ │ ⏰ Expires in: 11 hours 45 minutes                 │   │
│ │                                                     │   │
│ │ Created: Jan 15, 2024 at 10:00 AM                 │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 📱 iOS 17.2                          [Logout] 🗑️  │   │
│ │ Safari 17.0 • Mobile                                │   │
│ │                                                     │   │
│ │ 📍 IP: 10.0.0.50                                   │   │
│ │ 🕐 Last active: 45 minutes ago                     │   │
│ │ ⏰ Expires in: 6 hours 15 minutes                  │   │
│ │                                                     │   │
│ │ Created: Jan 15, 2024 at 8:00 AM                  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 💻 macOS 14.2                        [Logout] 🗑️  │   │
│ │ Chrome 120.0 • Desktop                              │   │
│ │                                                     │   │
│ │ 📍 IP: 172.16.0.10                                 │   │
│ │ 🕐 Last active: 3 hours ago                        │   │
│ │ ⏰ Expires in: 2 hours 30 minutes                  │   │
│ │                                                     │   │
│ │ Created: Jan 14, 2024 at 11:00 PM                 │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ ⚠️ Security Actions                                 │   │
│ │                                                     │   │
│ │ [Logout from All Other Devices]                    │   │
│ │ Keeps this device logged in, logs out 2 others     │   │
│ │                                                     │   │
│ │ [Logout from All Devices]                          │   │
│ │ Logs out everywhere including this device          │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**

1. **Session Cards** - Each card shows:
   - Device icon (🖥️ Desktop, 📱 Mobile, 💻 Tablet)
   - OS name + version
   - Browser name + version
   - Device type label
   - IP address
   - Last activity time (relative: "2 minutes ago")
   - Expiration time (relative: "11 hours 45 minutes")
   - Creation timestamp (formatted)
   - "You" badge for current session
   - "Logout" button (only for other sessions)

2. **Auto-refresh** - Update every 30 seconds to show latest activity

3. **Confirmation dialogs:**
   - "Logout from this device?" for individual logout
   - "Logout from all other devices? This will end 2 other sessions." for bulk action
   - "Logout from ALL devices? You will need to login again." for global logout

4. **Empty state:**
   ```
   No other sessions found.
   You're only logged in on this device.
   ```

5. **Loading state:** Show skeleton cards while fetching

---

## 🎨 UI Components to Create

### 1. SessionCard Component

**Props:**
```typescript
interface SessionCardProps {
  session: {
    sessionId: string;
    ipAddress: string;
    browser: string;
    operatingSystem: string;
    deviceType: 'Desktop' | 'Mobile' | 'Tablet';
    location?: string;
    createdAt: string;
    lastActivityAt: string;
    expiresAt: string;
    isCurrentSession: boolean;
  };
  onLogout: (sessionId: string) => void;
}
```

**Component Structure:**
```tsx
<div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
  <div className="flex items-start justify-between">
    <div className="flex items-start space-x-3">
      {/* Device icon */}
      <DeviceIcon type={deviceType} className="w-8 h-8" />
      
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-lg">{operatingSystem}</h3>
          {isCurrentSession && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
              You
            </span>
          )}
        </div>
        
        {/* Browser info */}
        <p className="text-sm text-gray-600">{browser} • {deviceType}</p>
        
        {/* Details */}
        <div className="mt-2 space-y-1 text-sm text-gray-500">
          <p>📍 IP: {ipAddress}</p>
          <p>🕐 Last active: {formatRelativeTime(lastActivityAt)}</p>
          <p>⏰ Expires in: {formatTimeUntil(expiresAt)}</p>
        </div>
        
        {/* Timestamp */}
        <p className="mt-2 text-xs text-gray-400">
          Created: {formatDateTime(createdAt)}
        </p>
      </div>
    </div>
    
    {/* Logout button (only for other sessions) */}
    {!isCurrentSession && (
      <button
        onClick={() => onLogout(sessionId)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    )}
  </div>
</div>
```

### 2. DeviceIcon Component

**Props:**
```typescript
interface DeviceIconProps {
  type: 'Desktop' | 'Mobile' | 'Tablet';
  className?: string;
}
```

**Implementation:**
```tsx
const DeviceIcon = ({ type, className }: DeviceIconProps) => {
  switch (type) {
    case 'Desktop':
      return <Monitor className={className} />;
    case 'Mobile':
      return <Smartphone className={className} />;
    case 'Tablet':
      return <Tablet className={className} />;
    default:
      return <Monitor className={className} />;
  }
};
```

---

## 🔧 State Management Updates

### Add to AuthContext

```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  sessionId: string | null;  // ADD THIS
  token: string | null;       // ADD THIS
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

### New SessionContext (Create this)

```typescript
interface SessionContextType {
  sessions: UserSession[];
  isLoading: boolean;
  error: string | null;
  currentSessionId: string | null;
  
  // Actions
  fetchSessions: () => Promise<void>;
  logoutSession: (sessionId: string) => Promise<void>;
  logoutOtherSessions: () => Promise<void>;
  logoutAllSessions: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  
  // Heartbeat
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
}

interface UserSession {
  sessionId: string;
  ipAddress: string;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  location: string | null;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  isCurrentSession: boolean;
}
```

---

## 💻 Client-Side Implementation

### 1. SessionManager Service

**Create:** `src/services/SessionManager.ts`

```typescript
export class SessionManager {
  private apiBaseUrl: string;
  private authToken: string;
  private sessionId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(apiBaseUrl: string, authToken: string, sessionId: string) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
    this.sessionId = sessionId;
  }

  // Start heartbeat - call after login
  startHeartbeat() {
    // Send heartbeat every 3 minutes
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 3 * 60 * 1000); // 3 minutes

    // Send immediate heartbeat
    this.sendHeartbeat();
  }

  // Stop heartbeat - call on logout
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Send heartbeat
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

    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }

    return await response.json();
  }

  // Logout from specific device
  async logoutDevice(sessionId: string) {
    const response = await fetch(`${this.apiBaseUrl}/api/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to logout device');
    }

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

    if (!response.ok) {
      throw new Error('Failed to logout other devices');
    }

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
    
    if (!response.ok) {
      throw new Error('Failed to logout all devices');
    }

    return await response.json();
  }

  // Validate current session
  async validateSession() {
    const response = await fetch(`${this.apiBaseUrl}/api/sessions/validate`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.isValid;
  }
}
```

### 2. Update Login Flow

**In your login/googleLogin functions:**

```typescript
async function login(email: string, password: string) {
  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  
  // Store token and sessionId
  setAuthToken(data.token);
  setSessionId(data.sessionId);  // NEW: Store sessionId
  
  // Initialize session manager
  const sessionManager = new SessionManager(apiUrl, data.token, data.sessionId);
  
  // Start heartbeat
  sessionManager.startHeartbeat();  // NEW: Start heartbeat
  
  // Complete handshake (existing code)
  await completeHandshake(data.handshake);
  
  // Navigate to dashboard
  navigate('/notes');
}
```

### 3. Update Logout Flow

```typescript
async function logout() {
  // Stop heartbeat
  sessionManager?.stopHeartbeat();  // NEW
  
  // Clear tokens
  setAuthToken(null);
  setSessionId(null);
  
  // Navigate to login
  navigate('/login');
}
```

---

## 🎯 Utility Functions Needed

### Time Formatting

```typescript
// Format relative time (e.g., "2 minutes ago")
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

// Format time until expiration (e.g., "11 hours 45 minutes")
export function formatTimeUntil(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = date.getTime() - now.getTime();
  
  if (diffMs < 0) return 'Expired';
  
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
  }
  
  return `${mins} minute${mins !== 1 ? 's' : ''}`;
}

// Format date time (e.g., "Jan 15, 2024 at 10:00 AM")
export function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
```

---

## 🔄 Navigation Updates

### Add to Settings Menu

```tsx
<nav>
  <Link to="/settings/account">Account</Link>
  <Link to="/settings/security">Security</Link>
  <Link to="/settings/sessions">Sessions</Link>  {/* NEW */}
  <Link to="/settings/data">Data</Link>
</nav>
```

### Add Route

```tsx
<Route path="/settings/sessions" element={<SessionsPage />} />
```

---

## 🎨 Visual Design Guidelines

### Colors

- **Current session badge:** `bg-blue-100 text-blue-700`
- **Inactive warning:** `bg-amber-50 text-amber-700`
- **Expired warning:** `bg-red-50 text-red-700`
- **Logout button:** `text-red-600 hover:text-red-700 hover:bg-red-50`
- **Success action:** `bg-green-50 text-green-700`

### Icons (from lucide-react)

- `Monitor` - Desktop device
- `Smartphone` - Mobile device
- `Tablet` - Tablet device
- `MapPin` - IP/Location
- `Clock` - Last activity/expiration
- `Trash2` - Logout button
- `Shield` - Security section
- `AlertTriangle` - Warnings

### Animations

- Session card hover: `hover:shadow-md transition-shadow`
- Logout button: `hover:scale-105 transition-transform`
- Loading skeleton: Pulse animation for cards
- Auto-refresh: Subtle fade in/out

---

## ⚠️ Important Notes

### Security Considerations

1. **Never store sessionId in localStorage** - Use memory or secure cookie
2. **Always validate heartbeat response** - Redirect to login if invalid
3. **Show confirmation for bulk actions** - Prevent accidental logouts
4. **Handle network errors gracefully** - Don't break heartbeat on temporary failure

### User Experience

1. **Auto-refresh sessions list** - Every 30 seconds
2. **Show loading states** - While fetching/revoking sessions
3. **Provide clear feedback** - Success/error messages
4. **Disable actions during API calls** - Prevent double-clicks
5. **Sort sessions** - Current first, then by last activity

### Edge Cases

1. **No sessions:** Show empty state
2. **Only current session:** Hide "logout other devices" button
3. **Session expired during view:** Show expired badge
4. **Network error:** Show retry button
5. **Multiple tabs:** Heartbeat should work across tabs

---

## ✅ Testing Checklist

1. **Login from multiple devices** - Verify all show in list
2. **Heartbeat works** - Session stays alive with activity
3. **Inactivity timeout** - Session expires after 30 min
4. **Logout specific device** - Removes from list
5. **Logout other devices** - Keeps current active
6. **Logout all devices** - Redirects to login
7. **Relative times update** - Auto-refresh works
8. **Device info displays** - Browser/OS shown correctly
9. **Current session badge** - Shows on correct session
10. **Expired sessions** - Show warning

---

## 📱 Mobile Responsive

### Sessions Page - Mobile View

```
┌────────────────────────────┐
│ ← Sessions                 │
├────────────────────────────┤
│                            │
│ Active Sessions (3)        │
│                            │
│ ┌────────────────────────┐│
│ │ 🖥️ Windows 10/11 [You]││
│ │ Chrome 120.0           ││
│ │                        ││
│ │ 📍 192.168.1.100      ││
│ │ 🕐 2 min ago          ││
│ │ ⏰ Expires: 11h 45m   ││
│ └────────────────────────┘│
│                            │
│ ┌────────────────────────┐│
│ │ 📱 iOS 17.2     [×]   ││
│ │ Safari 17.0            ││
│ │                        ││
│ │ 📍 10.0.0.50          ││
│ │ 🕐 45 min ago         ││
│ │ ⏰ Expires: 6h 15m    ││
│ └────────────────────────┘│
│                            │
│ [Logout Other Devices]     │
│ [Logout All Devices]       │
│                            │
└────────────────────────────┘
```

**Responsive Changes:**
- Stack cards vertically
- Smaller text sizes
- Compact spacing
- Bottom sheet for confirmation dialogs
- Sticky header with back button

---

## 🚀 Implementation Steps

1. **Create SessionManager service** - Handle API calls
2. **Create SessionCard component** - Display session info
3. **Create SessionsPage** - Main sessions management page
4. **Update AuthContext** - Add sessionId storage
5. **Create SessionContext** - Manage sessions state
6. **Update login flow** - Start heartbeat after login
7. **Update logout flow** - Stop heartbeat on logout
8. **Add utility functions** - Time formatting helpers
9. **Add navigation** - Link in settings menu
10. **Test thoroughly** - All scenarios and edge cases

---

## Summary

This update adds comprehensive session management with:

✅ Multi-device tracking
✅ Heartbeat monitoring (3-minute intervals)
✅ Remote logout capabilities
✅ Auto-expiration (30 min inactivity)
✅ Device information display
✅ Real-time activity tracking

**Key Benefits:**
- Enhanced security (prevent stolen tokens)
- User awareness (see all login locations)
- Remote control (logout from any device)
- Auto-cleanup (expired sessions removed)

All APIs are ready to integrate. Just add the UI components and connect them to the backend endpoints!
