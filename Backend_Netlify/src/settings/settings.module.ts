import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [StoresModule],
  controllers: [SettingsController],
  providers: [SettingsService, SupabaseService],
})
export class SettingsModule {}
