import { NextResponse } from 'next/server';
import { readdirSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const dir = join(process.cwd(), '..', '..', '..', 'supabase', 'migrations');
    const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    return NextResponse.json(files);
  } catch {
    return NextResponse.json({ error: 'Could not read migrations directory' }, { status: 500 });
  }
}
