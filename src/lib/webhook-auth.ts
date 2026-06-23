import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

/**
 * Verify a Supabase Database Webhook signature. Fail-closed: callers MUST
 * configure `SUPABASE_WEBHOOK_SECRET`; the previous fail-open shape (skip the
 * check when the env was unset) turned every notify handler into an
 * unauthenticated push-spam vector.
 */
export function verifyWebhookSignature(req: NextRequest): NextResponse | null {
  const expected = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!expected) {
    console.error('SUPABASE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
  }

  const provided = req.headers.get('x-webhook-secret') ?? '';
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (
    providedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return null;
}
