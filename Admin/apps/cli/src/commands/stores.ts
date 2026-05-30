import { Command } from 'commander';
import chalk from 'chalk';
import { getSupabase } from '@admin/db';
import { createTable, truncate, colorStatus, formatDate, die } from '../lib/display';

export const storesCommand = new Command('stores')
  .description('View stores and their details');

storesCommand
  .command('list')
  .description('List all stores with subscription status')
  .action(async () => {
    const db = getSupabase();

    const { data: stores, error } = await db
      .from('stores')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });

    if (error) die(error.message);
    if (!stores?.length) { console.log(chalk.yellow('No stores found.')); return; }

    const { data: members } = await db
      .from('store_members')
      .select('store_id, role, user_id');

    const memberCounts = new Map<string, number>();
    const ownerByStore = new Map<string, string>();
    for (const m of members ?? []) {
      memberCounts.set(m.store_id, (memberCounts.get(m.store_id) ?? 0) + 1);
      if (m.role === 'owner' && m.user_id) ownerByStore.set(m.store_id, m.user_id);
    }

    const ownerIds = [...new Set(ownerByStore.values())];
    const { data: subs } = ownerIds.length
      ? await db
          .from('subscriptions')
          .select('user_id, plan, status, expires_at')
          .in('user_id', ownerIds)
          .eq('status', 'active')
      : { data: [] };

    const subByOwner = new Map<string, { plan: string; status: string; expires_at: string | null }>();
    for (const s of subs ?? []) subByOwner.set(s.user_id, s);

    const table = createTable(['ID', 'Name', 'Members', 'Plan', 'Sub Expires', 'Created']);
    for (const store of stores) {
      const ownerId = ownerByStore.get(store.id);
      const sub = ownerId ? subByOwner.get(ownerId) : undefined;
      table.push([
        truncate(store.id),
        chalk.bold(store.name),
        String(memberCounts.get(store.id) ?? 0),
        sub ? chalk.bold(sub.plan) : chalk.dim('none'),
        sub ? formatDate(sub.expires_at) : chalk.dim('—'),
        formatDate(store.created_at),
      ]);
    }
    console.log(table.toString());
    console.log(chalk.dim(`  ${stores.length} store(s)\n`));
  });

storesCommand
  .command('show <storeId>')
  .description('Show full details for a store (members + subscription history)')
  .action(async (storeId) => {
    const db = getSupabase();

    const { data: store, error } = await db
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .maybeSingle();

    if (error) die(error.message);
    if (!store) die(`Store "${storeId}" not found`);

    console.log(`\n  ${chalk.bold.underline(store.name)}`);
    console.log(`  ID      : ${store.id}`);
    console.log(`  Created : ${formatDate(store.created_at)}`);

    const { data: members } = await db
      .from('store_members')
      .select('*')
      .eq('store_id', storeId)
      .order('role');

    if (members?.length) {
      console.log(`\n  ${chalk.cyan('Members')}`);
      const mt = createTable(['Email', 'Role', 'User ID', 'Invite Status']);
      for (const m of members) {
        mt.push([
          m.email,
          chalk.bold(m.role),
          m.user_id ? truncate(m.user_id, 20) : chalk.dim('(pending)'),
          m.invitation_status ?? 'accepted',
        ]);
      }
      console.log(mt.toString());

      const owner = members.find((m) => m.role === 'owner' && m.user_id);
      if (owner?.user_id) {
        const { data: subs } = await db
          .from('subscriptions')
          .select('*')
          .eq('user_id', owner.user_id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (subs?.length) {
          console.log(`\n  ${chalk.cyan('Subscriptions')} ${chalk.dim('(latest 5)')}`);
          const st = createTable(['ID', 'Plan', 'Status', 'Expires', 'Created']);
          for (const s of subs) {
            st.push([
              truncate(s.id, 16),
              chalk.bold(s.plan),
              colorStatus(s.status),
              formatDate(s.expires_at),
              formatDate(s.created_at),
            ]);
          }
          console.log(st.toString());
        }
      }
    }
    console.log();
  });

storesCommand
  .command('promo-codes <storeId>')
  .description('List all promo codes for a store')
  .action(async (storeId) => {
    const { data, error } = await getSupabase()
      .from('promo_codes')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) die(error.message);
    if (!data?.length) { console.log(chalk.yellow('No promo codes for this store.')); return; }

    const table = createTable(['Code', 'Type', 'Value', 'Applies To', 'Used / Max', 'Active', 'Expires']);
    for (const p of data) {
      const value = p.discount_type === 'percent'
        ? `${p.discount_value}%`
        : `Rp ${Number(p.discount_value).toLocaleString('id-ID')}`;
      table.push([
        chalk.bold(p.code),
        p.discount_type,
        value,
        p.applies_to,
        `${p.current_usages} / ${p.max_usages ?? '∞'}`,
        p.is_active ? chalk.green('yes') : chalk.red('no'),
        formatDate(p.expires_at),
      ]);
    }
    console.log(table.toString());
    console.log(chalk.dim(`  ${data.length} code(s)\n`));
  });
