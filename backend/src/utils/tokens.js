import crypto from 'crypto';

export function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function addSeconds(date, seconds) {
  return new Date(date.getTime() + seconds * 1000);
}

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP as string
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}