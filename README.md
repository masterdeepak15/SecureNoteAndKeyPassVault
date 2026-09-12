# SecureNote & KeyPass Vault 🔐

SecureNote is a self-hosted, secure note-taking and password management application featuring end-to-end RSA encryption, AES database encryption, and ASP.NET Core Identity authentication.

---

## 🚀 Quick Start (Docker Compose)

The easiest way to run SecureNote is using Docker Compose.

### 1. Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/) installed

### 2. Run with Docker Compose
Create a `docker-compose.yml` file (or use the one in this repository):

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
    restart: unless-stopped
```

Start the container:
```bash
docker compose up -d
```

Access the application in your browser:
👉 **`http://localhost:8080`**

---

## 🔑 Default Credentials

On initial startup, the database is automatically created, migrated, and seeded with a default administrator account:

| Field | Default Value |
|---|---|
| **Username / Email** | `admin@securenote.local` |
| **Password** | `Admin@123456` |

> ⚠️ **Important:** Log in immediately and change your password or register your personal user account to secure your installation.

---

## 💾 Data Persistence & Backup

All application data (SQLite database, encrypted records, keys, and sessions) is stored in `/app/backend/data` inside the container.

By mounting the host directory `./data:/app/backend/data`, all your data persists across container restarts, updates, and rebuilds.

### Backup
To back up your vault data, simply back up the `./data` folder on your host machine:
```bash
# Example backup command
tar -czvf securenote_backup_$(date +%F).tar.gz ./data/
```

### Restore
To restore data, extract your backup into `./data` before launching the container:
```bash
tar -xzvf securenote_backup_YYYY-MM-DD.tar.gz
docker compose up -d
```

---

## 🐳 Running with Standalone Docker CLI

If you prefer using `docker run` instead of Compose:

### Build Local Image
```bash
docker build -t securenote:latest .
```

### Run Container
```bash
docker run -d \
  --name securenote \
  -p 8080:80 \
  -v "$(pwd)/data:/app/backend/data" \
  -e ASPNETCORE_ENVIRONMENT=Production \
  --restart unless-stopped \
  securenote:latest
```

---

## 🛠️ GitHub Actions CI/CD Workflow

A GitHub Actions workflow is included at `.github/workflows/docker-publish.yml` that automatically builds and pushes multi-platform Docker images to the **GitHub Container Registry (GHCR)** on every push to the `main` branch.

### Pulling from GitHub Container Registry:
Once published to GHCR, you can pull and run the pre-built image directly:

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

## 🏗️ Architecture & Security

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + ShadCN UI + Tiptap Editor
- **Backend**: .NET 8 Web API + Entity Framework Core + ASP.NET Identity
- **Database**: SQLite with persistent volume mount
- **Containerization**: Single container bundling Nginx reverse proxy, .NET runtime, and static frontend served via Supervisor
- **Encryption**:
  - Client-side RSA handshake & payload encryption
  - Server-side AES database-level encryption for sensitive fields
  - ASP.NET Identity password hashing (PBKDF2 with HMAC-SHA256)

---

## ⚙️ Environment Variables

You can customize the deployment by passing environment variables in `docker-compose.yml`:

| Variable | Description | Default |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | Application environment (`Production` or `Development`) | `Production` |
| `Jwt__Key` | Secret key used for signing JWT tokens (min 32 chars) | Built-in fallback |
| `Jwt__Issuer` | Token issuer claim | `SecureNotesAPI` |
| `Jwt__Audience` | Token audience claim | `SecureNotesClient` |

---

## 📄 License

MIT License.
