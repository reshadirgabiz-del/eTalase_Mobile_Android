import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { StoresModule } from '../stores/stores.module';
import { EmailModule } from '../email/email.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [StoresModule, EmailModule, SubscriptionsModule],
  controllers: [MembersController],
  providers: [MembersService, SupabaseService],
})
export class MembersModule {}
