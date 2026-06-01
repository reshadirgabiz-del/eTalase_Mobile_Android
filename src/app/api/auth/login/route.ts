import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { SESSION_COOKIE, computeSessionToken } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { password } = body as { password?: unknown };

  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD ?? '';

  // Hash both to equalize length, then compare with timing-safe equal
  const inputHash = crypto.createHash('sha256').update(password).digest();
  const adminHash = crypto.createHash('sha256').update(adminPassword).digest();
  const match = crypto.timingSafeEqual(inputHash, adminHash);

  if (!match) {
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = await computeSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
