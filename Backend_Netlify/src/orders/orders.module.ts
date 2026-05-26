import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [StoresModule],
  controllers: [OrdersController],
  providers: [OrdersService, SupabaseService],
})
export class OrdersModule {}
