import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { SupabaseService } from '../common/supabase/supabase.service';

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, SupabaseService],
})
export class InvitationsModule {}
