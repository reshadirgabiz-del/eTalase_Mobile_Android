import chalk from 'chalk';
import Table from 'cli-table3';

export function createTable(headers: string[]): Table.Table {
  return new Table({
    head: headers.map((h) => chalk.cyan(h)),
    style: { 'padding-left': 1, 'padding-right': 1 },
  });
}

export function truncate(str: string | null | undefined, len = 12): string {
  if (!str) return chalk.dim('-');
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function colorStatus(status: string): string {
  switch (status) {
    case 'active':    return chalk.green(status);
    case 'expired':   return chalk.red(status);
    case 'cancelled': return chalk.dim(status);
    case 'pending':   return chalk.yellow(status);
    default:          return status;
  }
}

export function colorBool(val: boolean): string {
  return val ? chalk.green('yes') : chalk.red('no');
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return chalk.dim('—');
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) + '  ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function die(msg: string): never {
  console.error(chalk.red('Error: ') + msg);
  process.exit(1);
}
