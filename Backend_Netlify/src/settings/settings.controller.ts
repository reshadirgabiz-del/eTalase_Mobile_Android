import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('settings')
@UseGuards(ClerkAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get(@CurrentUser() userId: string, @Query('storeId') storeId: string) {
    return this.settingsService.get(userId, storeId);
  }

  @Patch()
  update(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.settingsService.update(dto, userId, storeId);
  }
}
