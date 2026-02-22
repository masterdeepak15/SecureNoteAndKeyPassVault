# Lovable.dev Prompt: Secure Notes & Password Manager UI

## Project Overview
Build a modern, secure web application for encrypted note-taking and password management with Google OAuth integration. The app features end-to-end encryption using RSA (transport) and AES-256 (storage) with automatic key exchange.

---

## Tech Stack Requirements

### Frontend
- **Framework:** React 18+ with TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State Management:** React hooks (useState, useEffect, useContext)
- **Routing:** React Router v6
- **HTTP Client:** Fetch API
- **Authentication:** Google Sign-In + JWT

### Key Libraries Needed
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "lucide-react": "^0.263.1",
    "@google/identity-services": "^1.0.0"
  }
}
```

---

## API Documentation

### Base URL
```
Production: https://api.yourdomain.com
Development: https://localhost:7000
```

### Authentication Endpoints

#### 1. Register User
```
POST /api/auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}

Response 200:
{
  "message": "User created successfully"
}

Response 400:
{
  "message": "User creation failed",
  "errors": ["Password must contain uppercase", "..."]
}
```

#### 2. Login (Email/Password)
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "Password123!"
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com",
  "expiration": "2024-01-02T12:00:00Z",
  "handshake": {
    "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serverPublicKey": "-----BEGIN PUBLIC KEY-----\nMIIB..."
  }
}

Response 401:
{
  "message": "Invalid credentials"
}
```

#### 3. Google Login
```
POST /api/auth/google-login
Content-Type: application/json

Request:
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjU5N..."
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@gmail.com",
  "name": "John Doe",
  "expiration": "2024-01-02T12:00:00Z",
  "handshake": {
    "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "serverPublicKey": "-----BEGIN PUBLIC KEY-----\nMIIB..."
  },
  "isNewUser": true
}

Response 401:
{
  "message": "Invalid Google token"
}
```

#### 4. Complete Handshake
```
POST /api/auth/handshake/complete
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "clientPublicKey": "-----BEGIN PUBLIC KEY-----\nMIIB..."
}

Response 200:
{
  "message": "Handshake completed successfully"
}

Response 400:
{
  "message": "Invalid or expired session"
}
```

### Notes Endpoints

#### 5. Get All Notes
```
GET /api/notes
Authorization: Bearer {token}
X-Session-Id: {sessionId}

Response 200:
[
  {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "encryptedTitle": "aBc123XyZ...==",
    "encryptedContent": "DeF456uVw...==",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
]

Note: encryptedTitle and encryptedContent are RSA-encrypted.
Client must decrypt with its private key.
```

#### 6. Get Note by ID
```
GET /api/notes/{id}
Authorization: Bearer {token}
X-Session-Id: {sessionId}

Response 200:
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "encryptedTitle": "aBc123XyZ...==",
  "encryptedContent": "DeF456uVw...==",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}

Response 404:
{
  "message": "Note not found"
}
```

#### 7. Create Note
```
POST /api/notes
Authorization: Bearer {token}
X-Session-Id: {sessionId}
Content-Type: application/json

Request:
{
  "encryptedTitle": "aBc123XyZ...==",
  "encryptedContent": "DeF456uVw...=="
}

Note: Client must RSA-encrypt title and content with server's public key before sending.

Response 201:
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "encryptedTitle": "aBc123XyZ...==",
  "encryptedContent": "DeF456uVw...==",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

#### 8. Update Note
```
PUT /api/notes/{id}
Authorization: Bearer {token}
X-Session-Id: {sessionId}
Content-Type: application/json

Request:
{
  "encryptedTitle": "NewTitle123...==",
  "encryptedContent": "NewContent456...=="
}

Response 200:
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "encryptedTitle": "NewTitle123...==",
  "encryptedContent": "NewContent456...==",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T11:00:00Z"
}

Response 404:
{
  "message": "Note not found"
}
```

#### 9. Delete Note
```
DELETE /api/notes/{id}
Authorization: Bearer {token}

Response 204: No Content

Response 404:
{
  "message": "Note not found"
}
```

### Password Manager Endpoints

#### 10. Get All Password Entries
```
GET /api/passwords
Authorization: Bearer {token}
X-Session-Id: {sessionId}

Response 200:
[
  {
    "id": "8d1e7780-8536-51f3-c4ed-3d074g77bfb8",
    "encryptedSiteName": "GhI789oPq...==",
    "encryptedUsername": "JkL012rSt...==",
    "encryptedPassword": "MnO345uVw...==",
    "encryptedUrl": "PqR678xYz...==",
    "encryptedServerIp": "StU901aBc...==",
    "encryptedHostname": "VwX234dEf...==",
    "encryptedNotes": "YzA567gHi...==",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
]

Note: All fields are RSA-encrypted. Client must decrypt.
```

#### 11. Get Password Entry by ID
```
GET /api/passwords/{id}
Authorization: Bearer {token}
X-Session-Id: {sessionId}

Response 200:
{
  "id": "8d1e7780-8536-51f3-c4ed-3d074g77bfb8",
  "encryptedSiteName": "GhI789oPq...==",
  "encryptedUsername": "JkL012rSt...==",
  "encryptedPassword": "MnO345uVw...==",
  "encryptedUrl": "PqR678xYz...==",
  "encryptedServerIp": "StU901aBc...==",
  "encryptedHostname": "VwX234dEf...==",
  "encryptedNotes": "YzA567gHi...==",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

#### 12. Create Password Entry
```
POST /api/passwords
Authorization: Bearer {token}
X-Session-Id: {sessionId}
Content-Type: application/json

Request:
{
  "encryptedSiteName": "GhI789oPq...==",
  "encryptedUsername": "JkL012rSt...==",
  "encryptedPassword": "MnO345uVw...==",
  "encryptedUrl": "PqR678xYz...==",
  "encryptedServerIp": "StU901aBc...==",  // optional
  "encryptedHostname": "VwX234dEf...==",  // optional
  "encryptedNotes": "YzA567gHi...=="      // optional
}

Note: Client must RSA-encrypt all fields with server's public key.

Response 201:
{
  "id": "8d1e7780-8536-51f3-c4ed-3d074g77bfb8",
  "encryptedSiteName": "GhI789oPq...==",
  "encryptedUsername": "JkL012rSt...==",
  "encryptedPassword": "MnO345uVw...==",
  "encryptedUrl": "PqR678xYz...==",
  "encryptedServerIp": "StU901aBc...==",
  "encryptedHostname": "VwX234dEf...==",
  "encryptedNotes": "YzA567gHi...==",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

#### 13. Update Password Entry
```
PUT /api/passwords/{id}
Authorization: Bearer {token}
X-Session-Id: {sessionId}
Content-Type: application/json

Request: Same as Create

Response 200: Same structure as Create
```

#### 14. Delete Password Entry
```
DELETE /api/passwords/{id}
Authorization: Bearer {token}

Response 204: No Content
```

---

## UI/UX Design Requirements

### Color Scheme
- **Primary:** Blue-600 (#2563eb) - Trust, security
- **Secondary:** Slate-700 (#334155) - Professional
- **Accent:** Emerald-500 (#10b981) - Success states
- **Danger:** Red-500 (#ef4444) - Delete, errors
- **Warning:** Amber-500 (#f59e0b) - Warnings
- **Background:** Slate-50 (#f8fafc)
- **Text:** Slate-900 (#0f172a)

### Typography
- **Font Family:** Inter, system-ui, sans-serif
- **Headings:** font-semibold, text-2xl to text-4xl
- **Body:** font-normal, text-sm to text-base
- **Code/Encrypted:** font-mono, text-xs

### Layout Structure

#### Navigation (Top Bar)
```
┌─────────────────────────────────────────────────────────────┐
│ 🔐 SecureNotes    Notes | Passwords | Settings    👤 User ▼ │
└─────────────────────────────────────────────────────────────┘
```

Components:
- Logo with lock icon (left)
- Navigation tabs: Notes, Passwords, Settings (center)
- User menu dropdown (right): Profile, Logout

---

## Page Descriptions

### 1. Landing Page (Before Login)

**Route:** `/`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              🔐 SecureNotes                         │
│         End-to-End Encrypted Notes                  │
│         & Password Manager                          │
│                                                      │
│     [Get Started] [Learn More]                      │
│                                                      │
│  Features:                                          │
│  ✓ Zero-knowledge encryption                       │
│  ✓ Google Sign-In                                  │
│  ✓ Secure password storage                         │
│  ✓ Cross-device sync                               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Features:**
- Hero section with large heading
- Feature cards (4 cards, 2x2 grid)
- Call-to-action buttons
- Animated lock icon
- Footer with links

### 2. Login Page

**Route:** `/login`

**Layout:**
```
┌────────────────────────────────────┐
│                                    │
│    🔐 Welcome Back                │
│                                    │
│    Email:    [____________]       │
│    Password: [____________]       │
│                                    │
│    [Login]                         │
│                                    │
│    ─────── OR ───────             │
│                                    │
│    [🔵 Sign in with Google]       │
│                                    │
│    Don't have account? [Register] │
│                                    │
└────────────────────────────────────┘
```

**Features:**
- Center-aligned card (max-width: 400px)
- Email input (type="email")
- Password input (type="password", with show/hide toggle)
- Login button (primary color)
- Google Sign-In button (white with Google colors)
- Link to register page
- Error messages displayed above form
- Loading state during authentication

### 3. Register Page

**Route:** `/register`

**Layout:**
```
┌────────────────────────────────────┐
│                                    │
│    🔐 Create Account              │
│                                    │
│    Email:            [__________] │
│    Password:         [__________] │
│    Confirm Password: [__________] │
│                                    │
│    Password requirements:          │
│    ✓ At least 8 characters        │
│    ✓ One uppercase letter          │
│    ✓ One number                    │
│    ✓ One special character         │
│                                    │
│    [Register]                      │
│                                    │
│    ─────── OR ───────             │
│                                    │
│    [🔵 Sign in with Google]       │
│                                    │
│    Have account? [Login]           │
│                                    │
└────────────────────────────────────┘
```

**Features:**
- Same styling as login page
- Password strength indicator
- Real-time validation feedback
- Confirm password matching validation
- Google Sign-In option

### 4. Notes Dashboard

**Route:** `/notes`

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Search: [🔍 ___________]  [+ New Note]   Sort: [Recent ▼]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ 📝 Note 1    │ │ 📝 Note 2    │ │ 📝 Note 3    │        │
│ │              │ │              │ │              │        │
│ │ Shopping...  │ │ Meeting...   │ │ Ideas for... │        │
│ │              │ │              │ │              │        │
│ │ Jan 15, 2024 │ │ Jan 14, 2024 │ │ Jan 10, 2024 │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ 📝 Note 4    │ │ 📝 Note 5    │ │ 📝 Note 6    │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Search bar (real-time filtering)
- "New Note" button (primary color)
- Sort dropdown (Recent, Alphabetical, Oldest)
- Grid layout (3 columns on desktop, 1 on mobile)
- Each note card shows:
  - Note icon
  - Title (truncated if long)
  - Preview (first 2 lines, truncated)
  - Date (formatted: "Jan 15, 2024")
  - Hover effect
- Click card to open note editor
- Empty state when no notes: "No notes yet. Create your first note!"

### 5. Note Editor (Modal/Drawer)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Title: [________________________]              [✕ Close] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Text editing area - full height]                      │
│                                                         │
│ Supports:                                              │
│ - Plain text                                           │
│ - Line breaks                                          │
│ - No rich formatting (for security)                    │
│                                                         │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Created: Jan 15, 2024        [Delete] [Save]          │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Full-screen modal or right drawer (choose best UX)
- Title input (single line)
- Content textarea (auto-resize, minimum 300px height)
- Save button (auto-save after 2 seconds of no typing)
- Delete button with confirmation dialog
- Close button (prompts to save if changes)
- Character count display
- Last saved timestamp
- Encryption indicator: "🔒 Encrypted"

### 6. Passwords Dashboard

**Route:** `/passwords`

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Search: [🔍 ___________]  [+ New Password]  Sort: [A-Z ▼]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────┐        │
│ │ 🌐 GitHub                          📋 👁️ 🗑️ │        │
│ │ username@example.com                            │        │
│ │ https://github.com                              │        │
│ │ Last updated: Jan 15, 2024                      │        │
│ └─────────────────────────────────────────────────┘        │
│                                                             │
│ ┌─────────────────────────────────────────────────┐        │
│ │ 🌐 Google                          📋 👁️ 🗑️ │        │
│ │ myemail@gmail.com                               │        │
│ │ https://google.com                              │        │
│ │ Last updated: Jan 14, 2024                      │        │
│ └─────────────────────────────────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Search bar (filters by site name, username, URL)
- "New Password" button
- Sort dropdown (A-Z, Z-A, Recent, Oldest)
- List layout (full width cards)
- Each card shows:
  - Globe/website icon
  - Site name (bold, large)
  - Username/email (smaller text)
  - URL (link, truncated)
  - Last updated date
  - Action buttons (right side):
    - 📋 Copy password
    - 👁️ View details
    - 🗑️ Delete
- Click card to open password details
- Empty state: "No passwords saved. Add your first password!"

### 7. Password Editor (Modal)

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ Add/Edit Password                          [✕ Close] │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Site Name: [___________________]                     │
│ Username:  [___________________]                     │
│ Password:  [___________________] [👁️] [🔄 Generate] │
│ URL:       [___________________]                     │
│                                                      │
│ Advanced ▼                                           │
│   Server IP: [___________________]                   │
│   Hostname:  [___________________]                   │
│   Notes:     [                  ]                    │
│              [                  ]                    │
│                                                      │
├──────────────────────────────────────────────────────┤
│ Created: Jan 15, 2024        [Delete] [Save]        │
└──────────────────────────────────────────────────────┘
```

**Features:**
- Modal (centered, max-width: 600px)
- Site name input (required)
- Username input (required)
- Password input with:
  - Show/hide toggle (eye icon)
  - Generate button (creates strong password)
  - Password strength indicator
- URL input (with validation)
- Advanced section (collapsible):
  - Server IP (optional)
  - Hostname (optional)
  - Notes textarea (optional)
- Save button (validates required fields)
- Delete button (confirmation dialog)
- Close button (prompts if unsaved changes)

### 8. Password Generator Dialog

**Layout:**
```
┌────────────────────────────────────┐
│ Generate Strong Password           │
├────────────────────────────────────┤
│                                    │
│ Generated: [aBc123!@#XyZ]  [📋]   │
│                                    │
│ Length: [16] [━━━━●━━━] (8-32)    │
│                                    │
│ Include:                           │
│ ☑ Uppercase (A-Z)                 │
│ ☑ Lowercase (a-z)                 │
│ ☑ Numbers (0-9)                   │
│ ☑ Symbols (!@#$%)                 │
│                                    │
│ [Regenerate] [Use This Password]   │
│                                    │
└────────────────────────────────────┘
```

**Features:**
- Real-time password generation
- Length slider (8-32 characters)
- Checkboxes for character types
- Copy to clipboard button
- Regenerate button
- "Use This Password" button (closes and fills password field)
- Visual strength indicator (weak/medium/strong)

### 9. Settings Page

**Route:** `/settings`

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Settings                                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Account                                             │
│ ┌─────────────────────────────────────────────┐   │
│ │ Email: user@example.com                     │   │
│ │ Login Method: Google                        │   │
│ │ Member Since: Jan 1, 2024                   │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Security                                            │
│ ┌─────────────────────────────────────────────┐   │
│ │ Current Session: 3fa85f64...                │   │
│ │ Expires: Jan 2, 2024                        │   │
│ │ [Refresh Session]                           │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Data                                                │
│ ┌─────────────────────────────────────────────┐   │
│ │ Notes: 15                                   │   │
│ │ Passwords: 8                                │   │
│ │ Total Storage: ~125 KB                      │   │
│ │ [Export All Data]                           │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Danger Zone                                         │
│ ┌─────────────────────────────────────────────┐   │
│ │ [Delete All Notes]                          │   │
│ │ [Delete All Passwords]                      │   │
│ │ [Delete Account]                            │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Account info (read-only)
- Session management
- Data statistics
- Export functionality
- Danger zone with confirmations

---

## RSA Encryption Client (JavaScript)

### Integration Requirements

You MUST include the RSA encryption client from `SecureNotesClient.js`. Key methods:

```typescript
class SecureNotesClient {
  // Initialize
  constructor(apiBaseUrl: string)
  
  // Authentication
  async register(email: string, password: string, confirmPassword: string)
  async login(email: string, password: string)
  async googleLogin(idToken: string)
  
  // Handshake (auto-initiated on login)
  async performHandshake()
  
  // Notes
  async createNote(title: string, content: string)
  async getAllNotes()
  async getNoteById(id: string)
  async updateNote(id: string, title: string, content: string)
  async deleteNote(id: string)
  
  // Passwords
  async createPasswordEntry(siteName, username, password, url, serverIp?, hostname?, notes?)
  async getAllPasswordEntries()
  async getPasswordEntryById(id: string)
  async updatePasswordEntry(id, siteName, username, password, url, serverIp?, hostname?, notes?)
  async deletePasswordEntry(id: string)
  
  // Utility
  logout()
}
```

**CRITICAL:** All encryption/decryption is handled by this client. Never send plaintext to server!

---

## Component Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── GoogleSignIn.tsx
│   ├── notes/
│   │   ├── NotesList.tsx
│   │   ├── NoteCard.tsx
│   │   ├── NoteEditor.tsx
│   │   └── NoteSearch.tsx
│   ├── passwords/
│   │   ├── PasswordsList.tsx
│   │   ├── PasswordCard.tsx
│   │   ├── PasswordEditor.tsx
│   │   ├── PasswordGenerator.tsx
│   │   └── PasswordSearch.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx (optional)
│   │   └── Footer.tsx
│   └── common/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Dropdown.tsx
│       ├── Card.tsx
│       ├── Toast.tsx
│       └── Loader.tsx
├── pages/
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── NotesPage.tsx
│   ├── PasswordsPage.tsx
│   └── SettingsPage.tsx
├── services/
│   ├── SecureNotesClient.ts (from provided file)
│   └── api.ts
├── context/
│   ├── AuthContext.tsx
│   └── EncryptionContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useNotes.ts
│   └── usePasswords.ts
└── utils/
    ├── validation.ts
    └── formatting.ts
```

---

## State Management

### Auth Context
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  sessionId: string | null;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

### Encryption Context
```typescript
interface EncryptionContextType {
  client: SecureNotesClient | null;
  isHandshakeComplete: boolean;
  initializeEncryption: (token: string, handshakeData: any) => Promise<void>;
}
```

---

## User Flows

### First Time User (Google Sign-In)
1. User clicks "Sign in with Google"
2. Google popup opens
3. User selects account
4. Redirect back to app
5. Auto-handshake completes
6. Redirect to `/notes`
7. Show welcome message: "Welcome! Start by creating your first note."

### Returning User (Email/Password)
1. User enters email/password
2. Click "Login"
3. Loading state
4. Auto-handshake completes
5. Redirect to last visited page or `/notes`

### Creating a Note
1. User clicks "+ New Note"
2. Modal/drawer opens
3. User types title and content
4. Auto-save after 2 seconds
5. Show "Saved ✓" indicator
6. User clicks Close or Save
7. Modal closes, note appears in list

### Creating a Password
1. User clicks "+ New Password"
2. Modal opens
3. User fills required fields
4. (Optional) Click "Generate Password"
5. Password generator opens
6. User customizes and clicks "Use This Password"
7. Password filled in form
8. User clicks "Save"
9. Validation passes
10. Password encrypted and sent to API
11. Modal closes, password appears in list

### Viewing a Password
1. User clicks password card or "View" icon
2. Modal opens with all fields
3. Password field is hidden (*****)
4. User clicks eye icon to reveal
5. Password shown for 30 seconds, then auto-hides
6. User can click "Copy" to copy password
7. Toast notification: "Password copied!"

---

## Security Indicators

Add visual security indicators throughout:

1. **Encryption Badge:** 🔒 "End-to-end encrypted" badge on all notes/passwords
2. **Session Status:** Green dot when handshake is active
3. **Auto-hide Passwords:** Passwords auto-hide after 30 seconds when revealed
4. **Secure Connection:** Show "Secure" badge in footer
5. **Zero-knowledge:** Tooltip explaining we can't see your data

---

## Responsive Design

### Desktop (≥1024px)
- 3-column grid for notes
- 2-column layout for passwords list
- Side-by-side modals (where appropriate)

### Tablet (768px - 1023px)
- 2-column grid for notes
- Single column for passwords
- Full-screen modals

### Mobile (< 768px)
- Single column for all lists
- Full-screen modals/drawers
- Bottom navigation bar (optional)
- Hamburger menu for main nav

---

## Accessibility Requirements

- All interactive elements keyboard accessible
- Proper ARIA labels
- Focus indicators
- Screen reader support
- Semantic HTML
- Color contrast ratio ≥ 4.5:1
- Form validation messages announced

---

## Performance Requirements

- Initial load: < 3 seconds
- Encryption/decryption: < 100ms per field
- Lazy load routes
- Debounced search (300ms)
- Auto-save debounced (2 seconds)
- Infinite scroll for large lists (> 50 items)

---

## Error Handling

### Network Errors
```
Toast: "Connection lost. Check your internet."
+ Retry button
```

### Session Expired
```
Modal: "Your session has expired. Please login again."
+ [Login] button
```

### Encryption Failed
```
Toast: "Failed to encrypt data. Please refresh and try again."
+ [Refresh] button
```

### API Errors
```
Toast: "{error.message}"
+ Details in console (dev mode only)
```

---

## Additional Features

### 1. Search Functionality
- Real-time search (debounced 300ms)
- Search notes by title and content
- Search passwords by site name, username, URL
- Highlight matching text

### 2. Sorting Options
- Notes: Recent, Oldest, A-Z, Z-A
- Passwords: A-Z, Z-A, Recent, Oldest

### 3. Bulk Actions (Future)
- Select multiple notes/passwords
- Delete selected
- Export selected

### 4. Export
- Export all notes as JSON
- Export all passwords as JSON (encrypted)
- Download as file

### 5. Import (Future)
- Import from KeePass
- Import from CSV
- Import from other password managers

---

## Testing Requirements

1. Login flow works
2. Google Sign-In works
3. Create/Read/Update/Delete notes
4. Create/Read/Update/Delete passwords
5. Search filters correctly
6. Password generator works
7. Copy to clipboard works
8. Auto-save works
9. Session expires properly
10. Responsive on all screen sizes

---

## Environment Variables

```env
VITE_API_URL=https://localhost:7000
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

---

## Deployment Notes

1. Build: `npm run build`
2. Environment: Set production API URL
3. Google OAuth: Configure production redirect URIs
4. HTTPS: Required for production
5. CSP: Configure Content Security Policy

---

## Summary

Build a modern, secure note-taking and password management app with:
- Clean, professional UI (Tailwind CSS)
- End-to-end encryption (handled by SecureNotesClient)
- Google Sign-In + Email/Password auth
- Full CRUD for notes and passwords
- Responsive design
- Excellent UX with loading states, error handling, auto-save

The app should feel like a professional SaaS product with emphasis on security (visual indicators), smooth animations, and intuitive workflows.

**Key Success Metric:** Users should feel their data is completely private and secure, with seamless encryption happening transparently in the background.
