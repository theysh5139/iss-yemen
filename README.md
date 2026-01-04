# ISS Yemen Webpage

Monorepo with backend (Express + MongoDB) and frontend (React + Vite).

**Project Location:** `C:\Users\Dell\APPDEV\iss-yemen-webpage`

## Prerequisites
- Node.js 18+
- npm
- MongoDB (local or Atlas)

## Setup

### 1) Install dependencies (both apps)
```bash
npm run install:all
```

### 2) Configure environment variables
Create `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/iss_yemen_club
SERVER_BASE_URL=http://localhost:5000
CLIENT_BASE_URL=http://localhost:5173
JWT_SECRET=change_me
```
(Optional) `frontend/.env` if your backend URL differs:
```
VITE_API_BASE_URL=http://localhost:5000
```

### 3) Run both servers
```bash
npm run dev
```
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

Health endpoints:
- API: `GET /health` → `{ ok: true }`
- DB: `GET /api/health/db` → `{ state, readyState }`

## Development Notes
- Auth: JWT (HTTP-only cookie), bcrypt for password hashing
- Email + password signup with email verification (mock email logs)
- Login, logout, forgot/reset password implemented
- Admin login credentials for testing, email: admin@issyemen.com password: Admin123!

## Scripts
- `npm run install:all` – install deps for backend & frontend
- `npm run dev` – run both apps (concurrently)
- `npm start` – run both apps in production mode

## Manual Test Flow
1. Sign up at `/signup` → check backend console for verification link → open it.
2. Log in at `/login` → redirected to `/dashboard`.
3. Log out at `/dashboard`.
4. Forgot password at `/forgot-password` → open reset link from console → set new password at `/reset-password`.

## Production
- Set strong `JWT_SECRET` and secure cookies over HTTPS (NODE_ENV=production).
- Use a real email service (e.g., Nodemailer + SMTP, SendGrid) instead of the mock logger.

## Git Push Instructions

To push your latest changes to the main branch, follow these steps:

### Quick Push (All Changes)
```bash
# Navigate to the project root (iss-yemen directory)
cd iss-yemen/backend

# Add all changes (including new files)
git add -A

# Commit with a descriptive message
git commit -m "Your commit message describing the changes"

# Push to main branch
git push origin main
```

### Step-by-Step Process

1. **Navigate to the backend directory** (where the git repository is initialized):
   ```bash
   cd iss-yemen/backend
   ```

2. **Check current status** to see what files have changed:
   ```bash
   git status
   ```

3. **Pull latest changes** (recommended to avoid conflicts):
   ```bash
   git pull origin main
   ```

4. **Add all changes** (modified and new files):
   ```bash
   git add -A
   ```
   Or add specific files:
   ```bash
   git add path/to/file.js
   ```

5. **Commit your changes** with a descriptive message:
   ```bash
   git commit -m "Add feature: admin header icons with search functionality"
   ```
   
   Example commit messages:
   - `"Add background image to homepage"`
   - `"Update admin sidebar to maintain active state"`
   - `"Fix profile page redirect for administrators"`
   - `"Add search popup with keyword matching for admin pages"`

6. **Push to main branch**:
   ```bash
   git push origin main
   ```

### Including New Files

When adding new files (untracked files), use:
```bash
git add -A
```
This command adds all changes including:
- Modified files
- New files (untracked)
- Deleted files

### Troubleshooting

**If you get "Updates were rejected":**
```bash
# Pull latest changes first
git pull origin main
# Resolve any conflicts if they occur
# Then push again
git push origin main
```

**If you need to see what will be committed:**
```bash
git status
```

For more detailed instructions, see `GIT_PUSH_INSTRUCTIONS.md`.

# iss-yemen
ISS Yemen Web Application built by Beta Blockers
