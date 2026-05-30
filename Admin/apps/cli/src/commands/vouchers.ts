import { Command } from 'commander';
import chalk from 'chalk';
import { getSupabase } from '@admin/db';
import { createTable, colorBool, formatDate, die } from '../lib/display';

export const vouchersCommand = new Command('vouchers')
  .alias('v')
  .description('Manage plan vouchers (subscription discount codes)');

vouchersCommand
  .command('list')
  .description('List all plan vouchers')
  .action(async () => {
    const { data, error } = await getSupabase()
      .from('plan_vouchers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) die(error.message);
    if (!data?.length) { console.log(chalk.yellow('No vouchers found.')); return; }

    const table = createTable(['Code', 'Type', 'Value', 'Used / Max', 'Expires', 'Active', 'Created']);
    for (const v of data) {
      const value = v.discount_type === 'percent'
        ? chalk.cyan(`${v.discount_value}%`)
        : chalk.cyan(`Rp ${Number(v.discount_value).toLocaleString('id-ID')}`);
      const usages = `${v.current_usages} / ${v.max_usages ?? chalk.dim('∞')}`;
      table.push([
        chalk.bold(v.code),
        v.discount_type,
        value,
        usages,
        formatDate(v.expires_at),
        colorBool(v.is_active),
        formatDate(v.created_at),
      ]);
    }
    console.log(table.toString());
    console.log(chalk.dim(`  ${data.length} voucher(s)\n`));
  });

vouchersCommand
  .command('create')
  .description('Create a new plan voucher')
  .requiredOption('-c, --code <code>', 'Voucher code (e.g. WELCOME20)')
  .requiredOption('-t, --type <type>', 'Discount type: percent | absolute')
  .requiredOption('-v, --value <value>', 'Discount value (e.g. 20 for 20%, or 50000 for Rp 50.000)')
  .option('-m, --max-usages <n>', 'Maximum total uses (omit for unlimited)')
  .option('-e, --expires <date>', 'Expiry date in YYYY-MM-DD format (omit for no expiry)')
  .action(async (opts) => {
    if (!['percent', 'absolute'].includes(opts.type)) die('--type must be: percent | absolute');

    const value = parseFloat(opts.value);
    if (isNaN(value) || value <= 0) die('--value must be a positive number');
    if (opts.type === 'percent' && value > 100) die('Percent discount cannot exceed 100');

    const payload: Record<string, unknown> = {
      code: opts.code.toUpperCase().trim(),
      discount_type: opts.type,
      discount_value: value,
    };

    if (opts.maxUsages) {
      const max = parseInt(opts.maxUsages, 10);
      if (isNaN(max) || max < 1) die('--max-usages must be a positive integer');
      payload.max_usages = max;
    }

    if (opts.expires) {
      const d = new Date(opts.expires);
      if (isNaN(d.getTime())) die('--expires must be a valid date: YYYY-MM-DD');
      payload.expires_at = d.toISOString();
    }

    const { data, error } = await getSupabase()
      .from('plan_vouchers')
      .insert(payload)
      .select()
      .single();

    if (error) die(error.message);

    const displayValue = opts.type === 'percent'
      ? `${value}%`
      : `Rp ${value.toLocaleString('id-ID')}`;

    console.log(chalk.green('\n  ✓ Voucher created\n'));
    console.log(`  Code      : ${chalk.bold(data.code)}`);
    console.log(`  Discount  : ${chalk.bold(displayValue)}`);
    console.log(`  Max Uses  : ${data.max_usages ?? 'unlimited'}`);
    console.log(`  Expires   : ${formatDate(data.expires_at)}`);
    console.log(`  ID        : ${data.id}\n`);
  });

vouchersCommand
  .command('toggle <code>')
  .description('Toggle a voucher between active and inactive')
  .action(async (code) => {
    const db = getSupabase();
    const { data: existing, error: fetchErr } = await db
      .from('plan_vouchers')
      .select('id, code, is_active')
      .ilike('code', code)
      .maybeSingle();

    if (fetchErr) die(fetchErr.message);
    if (!existing) die(`Voucher "${code}" not found`);

    const { error } = await db
      .from('plan_vouchers')
      .update({ is_active: !existing.is_active })
      .eq('id', existing.id);

    if (error) die(error.message);

    const newState = !existing.is_active ? chalk.green('active') : chalk.red('inactive');
    console.log(`  ✓ Voucher ${chalk.bold(existing.code)} is now ${newState}\n`);
  });

vouchersCommand
  .command('delete <code>')
  .description('Permanently delete a voucher')
  .option('--yes', 'Skip confirmation when the voucher has been used')
  .action(async (code, opts) => {
    const db = getSupabase();
    const { data: existing } = await db
      .from('plan_vouchers')
      .select('id, code, current_usages')
      .ilike('code', code)
      .maybeSingle();

    if (!existing) die(`Voucher "${code}" not found`);

    if (existing.current_usages > 0 && !opts.yes) {
      console.warn(chalk.yellow(`  Warning: "${existing.code}" has been used ${existing.current_usages} time(s).`));
      console.warn(chalk.yellow('  Re-run with --yes to confirm deletion.\n'));
      process.exit(0);
    }

    const { error } = await db
      .from('plan_vouchers')
      .delete()
      .eq('id', existing.id);

    if (error) die(error.message);
    console.log(chalk.green(`  ✓ Voucher ${chalk.bold(existing.code)} deleted\n`));
  });
