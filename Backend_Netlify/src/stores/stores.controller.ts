import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('my')
  @UseGuards(ClerkAuthGuard)
  getMyStores(@CurrentUser() userId: string) {
    return this.storesService.getMyStores(userId);
  }

  @Get(':storeId/my-role')
  @UseGuards(ClerkAuthGuard)
  getMyRole(@Param('storeId') storeId: string, @CurrentUser() userId: string) {
    return this.storesService.getMyRole(storeId, userId);
  }

  @Get(':storeId/public')
  getPublicInfo(@Param('storeId') storeId: string) {
    return this.storesService.getPublicInfo(storeId);
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  create(@Body() dto: CreateStoreDto, @CurrentUser() userId: string) {
    return this.storesService.create(dto, userId);
  }
}
