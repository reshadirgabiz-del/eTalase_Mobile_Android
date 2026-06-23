import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  issueSessionToken,
} from '@/lib/auth';

// In-memory rate limiter: 10 attempts per 15 min per IP.
// Provides basic brute-force protection on warm instances; good enough for a
// single-admin panel. Use Upstash/Vercel KV for distributed enforcement.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { password } = body as { password?: unknown };

  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD ?? '';

  const inputHash = crypto.createHash('sha256').update(password).digest();
  const adminHash = crypto.createHash('sha256').update(adminPassword).digest();
  const match = crypto.timingSafeEqual(inputHash, adminHash);

  if (!match) {
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  // Clear attempts on successful login
  loginAttempts.delete(ip);

  const token = await issueSessionToken();
  const res = NextResponse.json({ ok: true, token });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
