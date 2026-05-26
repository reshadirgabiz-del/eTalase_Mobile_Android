import { Module } from '@nestjs/common';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [StoresController],
  providers: [StoresService, SupabaseService],
  exports: [StoresService],
})
export class StoresModule {}
