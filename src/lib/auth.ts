export const SESSION_COOKIE = 'admin_session';

// Sessions are valid for 7 days. The cookie also carries `maxAge=604800` so the
// browser drops it at the same time the server stops accepting it.
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

interface SessionPayload {
  jti: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice(0, (4 - (s.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(input: string): Promise<Uint8Array> {
  const secret = process.env.ADMIN_SESSION_SECRET ?? '';
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not configured');
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(input));
  return new Uint8Array(sig);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * Mint a new admin session token. Each call produces a unique token because
 * `jti` is randomized — the old shape `HMAC(secret, password)` returned the
 * same cookie every login, so leaked cookies could never be invalidated.
 */
export async function issueSessionToken(): Promise<string> {
  const jtiBytes = new Uint8Array(16);
  crypto.getRandomValues(jtiBytes);
  const payload: SessionPayload = {
    jti: base64UrlEncode(jtiBytes),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(encoded);
  return `${encoded}.${base64UrlEncode(sig)}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return false;

  const encodedPayload = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);

  let expectedSig: Uint8Array;
  try {
    expectedSig = await hmac(encodedPayload);
  } catch {
    return false;
  }

  let providedBytes: Uint8Array;
  try {
    providedBytes = base64UrlDecode(providedSig);
  } catch {
    return false;
  }
  if (!constantTimeEqual(expectedSig, providedBytes)) return false;

  let payload: SessionPayload;
  try {
    const json = new TextDecoder().decode(base64UrlDecode(encodedPayload));
    payload = JSON.parse(json) as SessionPayload;
  } catch {
    return false;
  }

  if (typeof payload.exp !== 'number' || typeof payload.iat !== 'number') {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  if (now >= payload.exp) return false;
  if (payload.iat > now + 60) return false; // reject clearly-future tokens

  return true;
}

export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_SECONDS;
