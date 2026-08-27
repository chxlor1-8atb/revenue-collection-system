// A simple, deterministic, bi-directional obfuscator that works on both Client and Server.
// It uses a math formula and Base64 to turn `1` into `THgtNjY2OQ`, hiding the raw integer.
// This prevents simple IDOR scraping scripts (1, 2, 3...)

const SALT_MULTIPLIER = 54321;
const SALT_ADDER = 12348;

export function encodeSecureId(id: number | string): string {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (isNaN(numericId)) return '';
  
  const obfuscatedNum = (numericId * SALT_MULTIPLIER) + SALT_ADDER;
  const payload = `HX-${obfuscatedNum}`;
  
  if (typeof btoa !== 'undefined') {
    return btoa(payload).replace(/=/g, ''); // Client-side
  } else {
    return Buffer.from(payload).toString('base64').replace(/=/g, ''); // Server-side
  }
}

export function decodeSecureId(token: string): number | null {
  try {
    let payload = '';
    // Restore padding if needed
    const paddedToken = token.padEnd(token.length + (4 - token.length % 4) % 4, '=');
    
    if (typeof atob !== 'undefined') {
      payload = atob(paddedToken);
    } else {
      payload = Buffer.from(paddedToken, 'base64').toString('utf-8');
    }

    if (!payload.startsWith('HX-')) return null;
    
    const obfuscatedNum = parseInt(payload.replace('HX-', ''), 10);
    const originalId = (obfuscatedNum - SALT_ADDER) / SALT_MULTIPLIER;
    
    if (Number.isInteger(originalId)) {
      return originalId;
    }
    return null;
  } catch (e) {
    return null;
  }
}
