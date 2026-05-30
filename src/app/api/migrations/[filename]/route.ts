import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const name = filename.endsWith('.sql') ? filename : `${filename}.sql`;
  const dir = join(process.cwd(), '..', '..', '..', 'supabase', 'migrations');

  try {
    const sql = readFileSync(join(dir, name), 'utf-8');
    return NextResponse.json({ sql });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
