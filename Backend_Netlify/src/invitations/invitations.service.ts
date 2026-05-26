import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class InvitationsService {
  private readonly clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  constructor(private readonly supabase: SupabaseService) {}

  async accept(token: string) {
    if (!token) throw new BadRequestException('Token tidak ditemukan');

    const { data: invite, error } = await this.supabase.client
      .from('store_members')
      .select('id, email, store_id, invitation_status, stores(name)')
      .eq('invitation_token', token)
      .single();

    if (error || !invite) {
      throw new NotFoundException('Undangan tidak ditemukan atau sudah kedaluwarsa');
    }

    const member = invite as any;

    if (member.invitation_status !== 'pending_email') {
      throw new BadRequestException('Undangan ini sudah pernah diterima');
    }

    // Resolve Clerk user_id by email
    let userId: string | null = null;
    try {
      const users = await this.clerk.users.getUserList({ emailAddress: [member.email] });
      const list = Array.isArray(users) ? users : (users as any).data ?? [];
      if (list.length > 0) userId = list[0].id;
    } catch {
      // user not in Clerk yet — will be linked when they sign up
    }

    const updateData: Record<string, any> = { invitation_status: 'accepted' };
    if (userId) updateData.user_id = userId;

    await this.supabase.client
      .from('store_members')
      .update(updateData)
      .eq('id', member.id);

    return {
      success: true,
      storeName: member.stores?.name ?? '',
      storeId: member.store_id,
    };
  }
}
