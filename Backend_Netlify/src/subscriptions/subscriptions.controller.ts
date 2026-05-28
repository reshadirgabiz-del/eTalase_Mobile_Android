import {
  Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CheckoutSubscriptionDto } from './dto/checkout-subscription.dto';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('plans')
  getPlans() {
    return this.subscriptions.getPlans();
  }

  @Get('my')
  @UseGuards(ClerkAuthGuard)
  getMySubscription(@CurrentUser() userId: string) {
    return this.subscriptions.getMySubscription(userId);
  }

  @Get('voucher/:code')
  validateVoucher(@Param('code') code: string) {
    return this.subscriptions.validateVoucher(code);
  }

  @Post('checkout')
  @UseGuards(ClerkAuthGuard)
  checkout(@Body() dto: CheckoutSubscriptionDto, @CurrentUser() userId: string) {
    return this.subscriptions.checkout(dto.plan, userId, dto.voucherCode);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Body() payload: Record<string, unknown>) {
    return this.subscriptions.handleWebhook(payload);
  }
}
