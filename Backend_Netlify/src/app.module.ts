import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './common/supabase/supabase.service';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { DeliveryModule } from './delivery/delivery.module';
import { SettingsModule } from './settings/settings.module';
import { MembersModule } from './members/members.module';
import { UsersModule } from './users/users.module';
import { InvitationsModule } from './invitations/invitations.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { OrderLinksModule } from './order-links/order-links.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    StoresModule,
    ProductsModule,
    OrdersModule,
    DeliveryModule,
    SettingsModule,
    MembersModule,
    UsersModule,
    InvitationsModule,
    SubscriptionsModule,
    OrderLinksModule,
  ],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class AppModule {}
