import { Command } from 'commander';
import chalk from 'chalk';
import { readdirSync, readFileSync } from 'fs';
import { resolve, basename } from 'path';

// Migrations live one level above the Admin directory
const migrationsDir = () => resolve(process.cwd(), '../supabase/migrations');

export const migrateCommand = new Command('migrate')
  .description('View and run database migration files');

migrateCommand
  .command('list')
  .description('List all migration files')
  .action(() => {
    const dir = migrationsDir();
    let files: string[];
    try {
      files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
    } catch {
      console.error(chalk.red(`Cannot read migrations directory: ${dir}`));
      console.error(chalk.dim('Make sure you are running this command from the Admin/ directory.\n'));
      process.exit(1);
    }

    if (!files.length) { console.log(chalk.yellow('No migration files found.')); return; }

    console.log(chalk.cyan(`\n  Migrations (${dir})\n`));
    files.forEach((f, i) => {
      const num = String(i + 1).padStart(2, '0');
      console.log(`  ${chalk.dim(num)}  ${f}`);
    });
    console.log();
  });

migrateCommand
  .command('show <filename>')
  .description('Print the SQL content of a migration file')
  .action((filename) => {
    const dir = migrationsDir();
    const name = filename.endsWith('.sql') ? filename : `${filename}.sql`;
    const filepath = resolve(dir, name);
    let sql: string;
    try {
      sql = readFileSync(filepath, 'utf-8');
    } catch {
      console.error(chalk.red(`File not found: ${filepath}`));
      process.exit(1);
    }
    console.log(chalk.dim(`\n-- ${name}\n`));
    console.log(sql);
  });

migrateCommand
  .command('run <filename>')
  .description('Execute a migration file against the database (requires DATABASE_URL in .env)')
  .action(async (filename) => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error(chalk.red('\n  DATABASE_URL is not set in Admin/.env'));
      console.log(chalk.dim('  Find it in: Supabase Dashboard → Project Settings → Database → Connection string (URI)'));
      console.log(chalk.dim('  Add:  DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres\n'));
      process.exit(1);
    }

    const dir = migrationsDir();
    const name = filename.endsWith('.sql') ? filename : `${filename}.sql`;
    const filepath = resolve(dir, name);

    let sql: string;
    try {
      sql = readFileSync(filepath, 'utf-8');
    } catch {
      console.error(chalk.red(`File not found: ${filepath}`));
      process.exit(1);
    }

    let pgModule: typeof import('pg');
    try {
      pgModule = await import('pg');
    } catch {
      console.error(chalk.red('  pg package is not installed. Run: npm install from Admin/'));
      process.exit(1);
    }

    const client = new pgModule.Client({ connectionString: dbUrl });
    try {
      await client.connect();
      console.log(chalk.dim(`  Running ${name}...`));
      await client.query(sql);
      console.log(chalk.green(`  ✓ Migration applied: ${name}\n`));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(chalk.red('\n  Migration failed: ') + msg + '\n');
      process.exit(1);
    } finally {
      await client.end();
    }
  });
