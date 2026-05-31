import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const BUCKET = 'label-assets';
const OBJECT_NAME = 'platform-logo';

export async function GET() {
  const db = createServerClient();
  const { data, error } = await db
    .from('plan_configs')
    .select('config')
    .eq('plan_key', '_label_assets')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ logoUrl: data?.config?.logoUrl ?? null });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const objectPath = `${OBJECT_NAME}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const db = createServerClient();

  // Ensure bucket exists (no-op if already created)
  await db.storage.createBucket(BUCKET, { public: true }).catch(() => null);

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(objectPath, buffer, {
      contentType: file.type || 'image/png',
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(objectPath);
  const logoUrl = urlData.publicUrl;

  // Persist URL in plan_configs
  const { data: existing } = await db
    .from('plan_configs')
    .select('config')
    .eq('plan_key', '_label_assets')
    .maybeSingle();

  const merged = { ...(existing?.config ?? {}), logoUrl };
  const { error: upsertError } = await db.from('plan_configs').upsert(
    { plan_key: '_label_assets', config: merged, updated_at: new Date().toISOString() },
    { onConflict: 'plan_key' },
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ logoUrl });
}
