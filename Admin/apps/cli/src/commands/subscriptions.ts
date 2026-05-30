import { Command } from 'commander';
import chalk from 'chalk';
import { getSupabase } from '@admin/db';
import { createTable, truncate, colorStatus, formatDate, die } from '../lib/display';

export const subscriptionsCommand = new Command('subscriptions')
  .alias('sub')
  .description('Manage user subscriptions');

subscriptionsCommand
  .command('list')
  .description('List all subscriptions')
  .option('-s, --status <status>', 'Filter: pending | active | expired | cancelled')
  .option('-u, --user <userId>', 'Filter by partial user ID')
  .action(async (opts) => {
    const db = getSupabase();
    let query = db
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (opts.status) query = query.eq('status', opts.status);
    if (opts.user)   query = query.ilike('user_id', `%${opts.user}%`);

    const { data, error } = await query;
    if (error) die(error.message);
    if (!data?.length) { console.log(chalk.yellow('No subscriptions found.')); return; }

    const table = createTable(['ID', 'User ID', 'Plan', 'Status', 'Expires', 'Created']);
    for (const s of data) {
      table.push([
        truncate(s.id),
        truncate(s.user_id, 16),
        chalk.bold(s.plan),
        colorStatus(s.status),
        formatDate(s.expires_at),
        formatDate(s.created_at),
      ]);
    }
    console.log(table.toString());
    console.log(chalk.dim(`  ${data.length} record(s)\n`));
  });

subscriptionsCommand
  .command('show <userId>')
  .description('Show all subscriptions for a user')
  .action(async (userId) => {
    const db = getSupabase();
    const { data, error } = await db
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) die(error.message);
    if (!data?.length) { console.log(chalk.yellow(`No subscriptions found for user: ${userId}`)); return; }

    const table = createTable(['ID', 'Plan', 'Status', 'Expires', 'Midtrans Order', 'Created']);
    for (const s of data) {
      table.push([
        s.id,
        chalk.bold(s.plan),
        colorStatus(s.status),
        formatDate(s.expires_at),
        s.midtrans_order_id ? truncate(s.midtrans_order_id, 20) : chalk.dim('—'),
        formatDate(s.created_at),
      ]);
    }
    console.log(table.toString());
  });

const VALID_PLANS = ['starter', 'growth', 'business', 'enterprise'];

subscriptionsCommand
  .command('activate <userId>')
  .description('Activate (or create) a subscription for a user')
  .requiredOption('-p, --plan <plan>', 'Plan: starter | growth | business | enterprise')
  .option('-d, --days <days>', 'Duration in days', '30')
  .action(async (userId, opts) => {
    if (!VALID_PLANS.includes(opts.plan)) die(`Invalid plan. Choose: ${VALID_PLANS.join(' | ')}`);

    const days = parseInt(opts.days, 10);
    if (isNaN(days) || days < 1) die('--days must be a positive integer');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const db = getSupabase();

    const { data: existing } = await db
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let result;
    if (existing) {
      result = await db
        .from('subscriptions')
        .update({ plan: opts.plan, status: 'active', expires_at: expiresAt.toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await db
        .from('subscriptions')
        .insert({ user_id: userId, plan: opts.plan, status: 'active', expires_at: expiresAt.toISOString() })
        .select()
        .single();
    }

    if (result.error) die(result.error.message);

    console.log(chalk.green('\n  ✓ Subscription activated\n'));
    console.log(`  User ID : ${chalk.bold(userId)}`);
    console.log(`  Plan    : ${chalk.bold(opts.plan)}`);
    console.log(`  Expires : ${chalk.bold(formatDate(expiresAt.toISOString()))}`);
    console.log(`  ID      : ${result.data.id}\n`);
  });

subscriptionsCommand
  .command('expire <id>')
  .description('Mark a subscription as expired (by subscription ID)')
  .action(async (id) => {
    const { error } = await getSupabase()
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('id', id);

    if (error) die(error.message);
    console.log(chalk.green(`  ✓ Subscription ${chalk.bold(truncate(id, 16))} marked as expired\n`));
  });

subscriptionsCommand
  .command('cancel <id>')
  .description('Cancel a subscription (by subscription ID)')
  .action(async (id) => {
    const { error } = await getSupabase()
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) die(error.message);
    console.log(chalk.green(`  ✓ Subscription ${chalk.bold(truncate(id, 16))} cancelled\n`));
  });
