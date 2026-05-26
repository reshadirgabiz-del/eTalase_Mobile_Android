import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { SupabaseService } from '../common/supabase/supabase.service';

@Module({
  controllers: [DeliveryController],
  providers: [DeliveryService, SupabaseService],
})
export class DeliveryModule {}
