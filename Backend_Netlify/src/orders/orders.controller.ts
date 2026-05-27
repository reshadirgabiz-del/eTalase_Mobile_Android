import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, AddAttachmentDto } from './dto/create-order.dto';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  list(
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('archived') archived?: string,
  ) {
    const archivedBool = archived === 'true' ? true : archived === 'false' ? false : undefined;
    return this.ordersService.list(userId, storeId, +page, +limit, status, archivedBool);
  }

  @Patch(':id/archive')
  @UseGuards(ClerkAuthGuard)
  archive(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.ordersService.archive(id, userId, storeId);
  }

  @Patch(':id/unarchive')
  @UseGuards(ClerkAuthGuard)
  unarchive(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.ordersService.unarchive(id, userId, storeId);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  getOne(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.ordersService.getOne(id, userId, storeId);
  }

  @Patch(':id/status')
  @UseGuards(ClerkAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.ordersService.updateStatus(id, dto.status, userId, storeId);
  }

  @Post(':id/attachments')
  @UseGuards(ClerkAuthGuard)
  addAttachment(
    @Param('id') id: string,
    @Body() dto: AddAttachmentDto,
    @CurrentUser() userId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.ordersService.addAttachment(id, dto, userId, storeId);
  }
}
