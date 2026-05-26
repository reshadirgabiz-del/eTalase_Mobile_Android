import { Controller, Post, Body } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryEstimateDto } from './dto/delivery-estimate.dto';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('estimate')
  estimate(@Body() dto: DeliveryEstimateDto) {
    return this.deliveryService.estimate(dto);
  }
}
