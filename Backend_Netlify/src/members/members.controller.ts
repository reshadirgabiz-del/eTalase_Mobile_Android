import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('stores/:storeId/members')
@UseGuards(ClerkAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  list(@Param('storeId') storeId: string, @CurrentUser() userId: string) {
    return this.membersService.list(storeId, userId);
  }

  @Post()
  invite(
    @Param('storeId') storeId: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() userId: string,
  ) {
    return this.membersService.invite(storeId, dto, userId);
  }

  @Delete(':memberId')
  remove(
    @Param('storeId') storeId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() userId: string,
  ) {
    return this.membersService.remove(storeId, memberId, userId);
  }

  @Patch(':memberId/transfer-ownership')
  transferOwnership(
    @Param('storeId') storeId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() userId: string,
  ) {
    return this.membersService.transferOwnership(storeId, memberId, userId);
  }
}
