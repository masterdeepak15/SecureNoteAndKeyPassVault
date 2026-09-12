# SecureNote & KeyPass Vault 🔐

A lightweight, high-security, **self-hosted note-taking and password management vault** with end-to-end RSA payload encryption, AES database-level encryption, and ASP.NET Core Identity authentication.

---

## 🎯 Purpose of this Self-Hosted Build

Most modern note and password management solutions store your sensitive secrets on third-party cloud infrastructure, subjecting your private credentials to third-party data breaches, compliance tracking, and recurring subscription fees.

**SecureNote was purpose-built as a self-hosted, sovereign solution:**

- 🛡️ **100% Data Sovereignty**: Your notes, passwords, and encryption keys never leave your server. All records are stored locally in an encrypted SQLite database.
- 🔒 **Dual-Layer Encryption**:
  - **RSA-4096 / RSA-2048 Asymmetric Handshake**: Secures API transport and sensitive payloads in memory.
  - **AES-256 Symmetric Database Encryption**: Passwords and note contents are encrypted before writing to disk.
- 📦 **Single-Container Simplicity**: Both the frontend (React/Vite) and backend (.NET 8 Web API) are bundled into a single lightweight Docker container managed by Supervisor and Nginx. No external database servers or complex multi-container networks required.
- 🏠 **Homelab & NAS Ready**: Designed to run seamlessly on a Raspberry Pi, home server, Synology/QNAP NAS, or private VPS behind a reverse proxy (e.g., Caddy, Traefik, Nginx Proxy Manager, Cloudflare Tunnels).

---

## 📸 Screenshots & UI Showcase

| 🔐 Authentication & Google SSO | 📝 Encrypted Notes Vault |
|---|---|
| ![Secure Authentication](assets/Screenshot%202026-09-12%20202627.png) | ![Notes Vault](assets/Screenshot%202026-09-12%20202705.png) |
| *Master credentials & Google OAuth 2.0 Single Sign-On.* | *Rich-text encrypted notes with end-to-end payload protection.* |

| 🔑 KeyPass Password Manager | ⚡ Password Generator Modal |
|---|---|
| ![Passwords Vault](assets/Screenshot%202026-09-12%20202725.png) | ![Password Generator](assets/Screenshot%202026-09-12%20202759.png) |
| *Categorized vault with one-click copy and search.* | *Entropy strength analyzer with customizable character sets.* |

| 📱 Device & Session Management | ⚙️ Vault Settings & Data Export |
|---|---|
| ![Session Management](assets/Screenshot%202026-09-12%20202822.png) | ![Security & Settings](assets/Screenshot%202026-09-12%20202851.png) |
| *Active device session tracking and one-click remote revocation.* | *Full JSON vault export, storage metrics, and account controls.* |

---

## 🚀 Quick Start (Docker Compose)

### 1. Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/) (v2+)

### 2. Run with Docker Compose
Clone the repository and run:

```bash
docker compose up -d
```

Access the application in your browser:
👉 **`http://localhost:8080`**

---

## 🔑 Default Credentials

On initial launch, the application automatically creates the SQLite database, applies Entity Framework Core migrations, and seeds a default administrator account:

| Field | Default Value |
|---|---|
| **Email / Username** | `admin@securenote.local` |
| **Password** | `Admin@123456` |

> ⚠️ **Security Notice:** Log in immediately after deployment and update your password or register your personal account.

---

## 🌐 Google OAuth 2.0 Login Setup

SecureNote supports Single Sign-On (SSO) via Google OAuth. To enable Google Sign-In on your self-hosted instance:

### Step 1: Create Credentials in Google Cloud Console
1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Create or select an existing project.
3. Click **Create Credentials** > **OAuth Client ID**.
4. Set **Application type** to `Web application`.
5. Under **Authorized JavaScript origins**, add your deployment URLs:
   - For local use: `http://localhost:8080` and `http://localhost`
   - For production domain: `https://vault.yourdomain.com`
6. Click **Create** and copy your **Client ID** (ends with `.apps.googleusercontent.com`).

### Step 2: Configure in `docker-compose.yml`
Uncomment and supply your Client ID in `docker-compose.yml`:

```yaml
services:
  securenote:
    build: .
    image: securenote:latest
    container_name: securenote
    ports:
      - "8080:80"
    volumes:
      - ./data:/app/backend/data
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - Google__ClientId=YOUR_CLIENT_ID.apps.googleusercontent.com
    restart: unless-stopped
```

### Step 3: Restart Container
```bash
docker compose up -d --force-recreate
```
The **Sign in with Google** button will automatically activate on the login and registration pages.

---

## 💾 Data Persistence & Backups

All persistent data (SQLite database, keys, active sessions) is written to `/app/backend/data` inside the container and mapped to `./data` on your host machine.

### Automated Backups
To back up your vault, simply archive the `./data` directory on the host:
```bash
tar -czvf securenote_backup_$(date +%F).tar.gz ./data/
```

### Restore
To restore data to a new instance:
```bash
tar -xzvf securenote_backup_YYYY-MM-DD.tar.gz
docker compose up -d
```

---

## 🐳 Standalone Docker CLI

If running without Docker Compose:

```bash
# 1. Build local image
docker build -t securenote:latest .

# 2. Run container
docker run -d \
  --name securenote \
  -p 8080:80 \
  -v "$(pwd)/data:/app/backend/data" \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e Google__ClientId="YOUR_CLIENT_ID.apps.googleusercontent.com" \
  --restart unless-stopped \
  securenote:latest
```

---

## 🛠️ GitHub Actions CI/CD Workflow

The repository includes a GitHub Actions workflow (`.github/workflows/docker-publish.yml`) that automatically builds and publishes the multi-stage Docker image to the **GitHub Container Registry (GHCR)** on every push to `main`.

To run directly from GHCR:
```yaml
services:
  securenote:
    image: ghcr.io/<your-github-username>/securenote:latest
    container_name: securenote
    ports:
      - "8080:80"
    volumes:
      - ./data:/app/backend/data
    restart: unless-stopped
```

---

## ⚙️ Environment Variables Reference

| Variable | Description | Default / Example |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | Runtime environment mode | `Production` |
| `Google__ClientId` | Google OAuth Web Client ID | `your-id.apps.googleusercontent.com` |
| `Jwt__Key` | Secret key for signing JWT tokens (min 32 chars) | Built-in fallback |
| `Jwt__Issuer` | JWT issuer claim | `SecureNotesAPI` |
| `Jwt__Audience` | JWT audience claim | `SecureNotesClient` |
| `Encryption__MasterKey` | Server-side master AES key | Built-in fallback |

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Radix / ShadCN UI, Tiptap Rich Text Editor
- **Backend**: .NET 8 Web API, Entity Framework Core, ASP.NET Core Identity
- **Database**: SQLite (stored in `./data/securenotesdb.db`)
- **Web Server / Process Management**: Nginx (Reverse Proxy & SPA hosting) + Supervisor in an Alpine/Debian base
- **Security**:
  - Client-side RSA asymmetric key generation and handshake
  - Server-side AES-256-CBC database encryption
  - ASP.NET Identity password hashing with PBKDF2

---

## 📄 License

MIT License.
