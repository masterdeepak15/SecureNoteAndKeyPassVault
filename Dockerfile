# ── Stage 1: Build React Frontend ──
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY SecureNoteAndKeyPassVault_UI/package.json SecureNoteAndKeyPassVault_UI/package-lock.json ./
RUN npm ci
COPY SecureNoteAndKeyPassVault_UI/ ./
RUN npm run build

# ── Stage 2: Build .NET Backend ──
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /src
COPY SecureNoteAndKeyPassVault_Backend_/SecureNotesAPI.csproj ./
RUN dotnet restore
COPY SecureNoteAndKeyPassVault_Backend_/ ./
RUN dotnet publish -c Release -o /app/publish

# ── Stage 3: Runtime ──
FROM mcr.microsoft.com/dotnet/aspnet:8.0
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx supervisor && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-build /app/publish /app/backend
COPY --from=frontend-build /app/dist /app/wwwroot
COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN mkdir -p /app/backend/data

EXPOSE 80

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
