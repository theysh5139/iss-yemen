import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const ACCESS_TTL = '4h' // Set to 4 hours per user request

export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export function authCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/',
    maxAge: 4 * 60 * 60 * 1000 // 4 hours
  }
}


