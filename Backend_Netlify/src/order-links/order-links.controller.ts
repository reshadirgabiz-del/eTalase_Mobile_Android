import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderLinksService } from './order-links.service';
import { CreateOrderLinkDto } from './dto/create-order-link.dto';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('order-links')
export class OrderLinksController {
  constructor(private readonly service: OrderLinksService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  create(
    @Body() dto: CreateOrderLinkDto,
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.service.create(dto, userId, storeId);
  }

  @Get(':id/public')
  getPublic(@Param('id') id: string) {
    return this.service.getPublic(id);
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  list(
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.service.list(userId, storeId);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  remove(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.service.remove(id, userId, storeId);
  }
}
