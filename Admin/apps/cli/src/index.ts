#!/usr/bin/env node
import { Command } from 'commander';
import { subscriptionsCommand } from './commands/subscriptions';
import { vouchersCommand } from './commands/vouchers';
import { storesCommand } from './commands/stores';
import { migrateCommand } from './commands/migrate';

const program = new Command();

program
  .name('admin')
  .description('Jastip Platform — Database Admin CLI')
  .version('1.0.0');

program.addCommand(subscriptionsCommand);
program.addCommand(vouchersCommand);
program.addCommand(storesCommand);
program.addCommand(migrateCommand);

program.parse(process.argv);
