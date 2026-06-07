import { createServerClient } from './supabase';

async function sendExpoMessages(messages: object[]) {
  for (let i = 0; i < messages.length; i += 100) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages.slice(i, i + 100)),
    });
  }
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const db = createServerClient();
  const { data: rows } = await db
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId);

  if (!rows?.length) return;

  const messages = rows.map((r: any) => ({
    to: r.token,
    sound: 'default',
    title,
    body,
    data: data ?? {},
  }));

  await sendExpoMessages(messages);
}

export async function sendPushToAdmins(
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const db = createServerClient();
  const { data: rows } = await db
    .from('admin_push_tokens')
    .select('token');

  if (!rows?.length) return;

  const messages = rows.map((r: any) => ({
    to: r.token,
    sound: 'default',
    title,
    body,
    data: data ?? {},
  }));

  await sendExpoMessages(messages);
}
