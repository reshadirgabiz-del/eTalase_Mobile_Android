import { Module } from '@nestjs/common';
import { OrderLinksService } from './order-links.service';
import { OrderLinksController } from './order-links.controller';
import { StoresModule } from '../stores/stores.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SupabaseService } from '../common/supabase/supabase.service';

@Module({
  imports: [StoresModule, SubscriptionsModule],
  controllers: [OrderLinksController],
  providers: [OrderLinksService, SupabaseService],
})
export class OrderLinksModule {}
