import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { StoresModule } from '../stores/stores.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    StoresModule,
    SubscriptionsModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, SupabaseService],
})
export class ProductsModule {}
