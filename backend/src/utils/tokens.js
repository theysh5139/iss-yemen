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