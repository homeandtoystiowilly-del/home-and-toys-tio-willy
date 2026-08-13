import { createHmac } from 'crypto';

const SECRET_KEY = process.env.ADMIN_PASSWORD || 'adminwilly';

export function generateSessionToken(): string {
  // Expira en 1 día
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24;
  const hmac = createHmac('sha256', SECRET_KEY);
  hmac.update(expiresAt.toString());
  const signature = hmac.digest('hex');
  return `${expiresAt}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  
  const [expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  
  // Validar expiración
  if (isNaN(expiresAt) || expiresAt < Date.now()) {
    return false;
  }
  
  // Validar firma criptográfica
  const hmac = createHmac('sha256', SECRET_KEY);
  hmac.update(expiresAtStr);
  const expectedSignature = hmac.digest('hex');
  
  return signature === expectedSignature;
}
