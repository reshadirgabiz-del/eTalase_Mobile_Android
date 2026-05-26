import { Injectable, BadRequestException } from '@nestjs/common';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { SupabaseService } from '../common/supabase/supabase.service';
import { UpdateUserDto } from './dto/update-user.dto';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async getMe(userId: string) {
    const user = await clerk.users.getUser(userId);
    return this.toProfile(user);
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await clerk.users.updateUser(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    return this.toProfile(user);
  }

  async deleteMe(userId: string) {
    const { data: ownedStores } = await this.supabase.client
      .from('store_members')
      .select('store_id')
      .eq('user_id', userId)
      .eq('role', 'owner');

    if (ownedStores?.length) {
      throw new BadRequestException(
        'Transfer kepemilikan atau hapus semua toko milikmu sebelum menghapus akun',
      );
    }

    await this.supabase.client
      .from('store_members')
      .delete()
      .eq('user_id', userId);

    await clerk.users.deleteUser(userId);
    return { success: true };
  }

  private toProfile(user: any) {
    return {
      id: user.id,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
      email: user.emailAddresses?.[0]?.emailAddress ?? null,
      imageUrl: user.imageUrl ?? null,
    };
  }
}
