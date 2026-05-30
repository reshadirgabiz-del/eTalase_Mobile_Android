import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { PlansAdminController } from './plans-admin.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SupabaseService } from '../common/supabase/supabase.service';

@Module({
  controllers: [SubscriptionsController, PlansAdminController],
  providers: [SubscriptionsService, SupabaseService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
