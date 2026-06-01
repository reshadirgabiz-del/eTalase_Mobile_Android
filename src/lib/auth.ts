export const SESSION_COOKIE = 'admin_session';

async function computeSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET ?? '';
  const password = process.env.ADMIN_PASSWORD ?? '';

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(password));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifySessionToken(token: string): Promise<boolean> {
  if (!token) return false;
  const expected = await computeSessionToken();
  if (expected.length !== token.length) return false;

  const enc = new TextEncoder();
  const a = enc.encode(expected);
  const b = enc.encode(token);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export { computeSessionToken };
