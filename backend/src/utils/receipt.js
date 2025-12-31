import { generateRandomToken } from './tokens.js';

/**
 * Generate a unique receipt ID
 * Format: REC-YYYYMMDD-XXXXXX
 */
export function generateReceiptId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = generateRandomToken(6).toUpperCase();
  return `REC-${year}${month}${day}-${random}`;
}

