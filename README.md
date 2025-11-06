# ISS Yemen Club Web App

Monorepo with backend (Express + MongoDB) and frontend (React + Vite).

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
# iss-yemen
ISS Yemen Web Application built by Beta Blockers
