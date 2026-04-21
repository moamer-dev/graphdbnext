import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // for aes-256

// Use an environment variable for the encryption key. 
const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY 
  ? Buffer.from(process.env.CREDENTIALS_ENCRYPTION_KEY, 'hex') 
  : crypto.scryptSync('development-fallback-key', 'salt', KEY_LENGTH);

if (!process.env.CREDENTIALS_ENCRYPTION_KEY) {
  console.warn('CREDENTIALS_ENCRYPTION_KEY is not set. Using development fallback key. DO NOT USE IN PRODUCTION.');
}

/**
 * Encrypts a string and returns a combined hex string containing:
 * iv (24 chars) + tag (32 chars) + encryptedData (variable)
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return iv.toString('hex') + tag.toString('hex') + encrypted;
}

/**
 * Decrypts a combined hex string
 */
export function decrypt(combinedHex: string): string {
  const iv = Buffer.from(combinedHex.slice(0, IV_LENGTH * 2), 'hex');
  const tag = Buffer.from(combinedHex.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), 'hex');
  const encrypted = combinedHex.slice((IV_LENGTH + TAG_LENGTH) * 2);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Helper to encrypt/decrypt JSON objects
 */
export function encryptJson(data: any): string {
  return encrypt(JSON.stringify(data));
}

export function decryptJson(encryptedData: string): any {
  try {
    return JSON.parse(decrypt(encryptedData));
  } catch (error) {
    console.error('Failed to decrypt JSON data:', error);
    return null;
  }
}
