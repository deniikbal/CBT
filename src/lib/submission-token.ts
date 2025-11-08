import crypto from 'crypto';

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface TokenData {
  pesertaId: string;
  jadwalId: string;
  timestamp: number;
  signature: string;
}

/**
 * Generate secure submission token
 * Format: base64(pesertaId:jadwalId:timestamp:signature)
 */
export function generateSubmissionToken(pesertaId: string, jadwalId: string): string {
  const timestamp = Date.now();
  const data = `${pesertaId}:${jadwalId}:${timestamp}`;
  
  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(data)
    .digest('hex');
  
  const token = `${data}:${signature}`;
  
  // Encode to base64 for URL safety
  return Buffer.from(token).toString('base64');
}

/**
 * Verify and decode submission token
 * Returns token data if valid, null if invalid or expired
 */
export function verifySubmissionToken(token: string): TokenData | null {
  try {
    // Decode from base64
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    
    if (parts.length !== 4) {
      console.error('Invalid token format');
      return null;
    }
    
    const [pesertaId, jadwalId, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    
    // Check expiry
    const now = Date.now();
    if (now - timestamp > TOKEN_EXPIRY) {
      console.error('Token expired');
      return null;
    }
    
    // Verify signature
    const data = `${pesertaId}:${jadwalId}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(data)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.error('Invalid signature');
      return null;
    }
    
    return {
      pesertaId,
      jadwalId,
      timestamp,
      signature,
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Format token data untuk logging
 */
export function formatTokenData(data: TokenData): string {
  const date = new Date(data.timestamp);
  return `[Token] Peserta: ${data.pesertaId}, Jadwal: ${data.jadwalId}, Created: ${date.toISOString()}`;
}
