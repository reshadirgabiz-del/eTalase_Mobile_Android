import { Controller, Get, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  updateMe(@CurrentUser() userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(userId, dto);
  }

  @Delete('me')
  deleteMe(@CurrentUser() userId: string) {
    return this.usersService.deleteMe(userId);
  }
}
