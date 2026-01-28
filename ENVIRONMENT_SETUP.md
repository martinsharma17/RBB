# Environment Variables Setup

## ⚠️ SECURITY NOTICE

All sensitive configuration has been moved from `appsettings.json` to environment variables to prevent accidental exposure on GitHub.

## Backend Setup (AUTHApi)

### 1. Environment Variables File

A `.env` file has been created in the `AUTHApi` directory with your current secrets. This file is **automatically ignored by Git** and will not be committed.

**Location**: `AUTHApi/.env`

### 2. Template File

A `.env.example` file is provided as a template showing all required environment variables. This file **can be committed** to Git as documentation.

**Location**: `AUTHApi/.env.example`

### 3. Configuration Changes

- **appsettings.json**: All sensitive values have been removed and replaced with empty strings
- **Program.cs**: Added code to load `.env` file automatically on startup
- **AUTHApi.csproj**: Added `DotNetEnv` package to read environment variables

### 4. Required Environment Variables

```bash
# JWT Configuration
JWT__KEY=your-secret-key-here-minimum-32-characters-long
JWT__ISSUER=YourAppName
JWT__AUDIENCE=YourAppNameUsers
JWT__EXPIREMINUTES=10

# Email Configuration
EMAIL__SMTPSERVER=smtp.gmail.com
EMAIL__SMTPPORT=587
EMAIL__SMTPUSER=your-email@gmail.com
EMAIL__SMTPPASSWORD=your-gmail-app-password

# Database Configuration
CONNECTIONSTRINGS__DEFAULTCONNECTION=Host=localhost;Port=5432;Database=RBB;Username=postgres;Password=your-password

# Frontend Configuration
FRONTEND__URL=http://localhost:5173

# Roles Configuration
ROLES__DEFAULTROLES__0=SuperAdmin
```

## Frontend Setup (AUTH-Frontend)

### 1. Environment Variables File

A `.env` file has been created in the `AUTH-Frontend` directory. This file is **automatically ignored by Git**.

**Location**: `AUTH-Frontend/.env`

### 2. Template File

**Location**: `AUTH-Frontend/.env.example`

### 3. Required Environment Variables

```bash
# Backend API URL
VITE_API_URL=http://localhost:5227
```

## How to Run

### Backend
```cmd
cd AUTHApi
dotnet restore
dotnet run
```

The application will automatically load the `.env` file on startup.

### Frontend
```cmd
cd AUTH-Frontend
npm install
npm run dev
```

Vite automatically loads `.env` files.

## For Production

In production environments, set environment variables through your hosting platform:
- **Azure**: Application Settings
- **AWS**: Environment Variables in Elastic Beanstalk/ECS
- **Docker**: Use `--env-file` flag or set in docker-compose.yml
- **Linux/Windows Server**: Set system environment variables

## 🔒 IMPORTANT SECURITY RECOMMENDATIONS

1. **Rotate Your Secrets** (CRITICAL):
   - Your JWT secret key was exposed in the previous `appsettings.json`
   - Your Gmail App Password was also exposed
   - Generate a new JWT key: Use a cryptographically secure random string (minimum 32 characters)
   - Regenerate your Gmail App Password from Google Account settings

2. **Check Git History**:
   - The exposed secrets remain in your Git history even after removal
   - If this repository has been pushed to GitHub, consider using `git-filter-repo` or BFG Repo-Cleaner to remove secrets from history
   - Alternatively, you can create a fresh repository if the history isn't critical

3. **Never Commit `.env` Files**:
   - The `.gitignore` has been updated to prevent this
   - Always double-check before committing: `git status`

4. **Team Collaboration**:
   - Share `.env.example` with team members
   - Send actual `.env` values through secure channels (password managers, encrypted messages)
   - Never commit or email actual `.env` files

## Verification

To verify `.env` files are properly ignored:

```cmd
git status
```

You should NOT see:
- `AUTHApi/.env`
- `AUTH-Frontend/.env`

You SHOULD see (if not yet committed):
- `AUTHApi/.env.example`
- `AUTH-Frontend/.env.example`
- `.gitignore` (modified)
- `appsettings.json` (modified)
- `Program.cs` (modified)
- `AUTHApi.csproj` (modified)
