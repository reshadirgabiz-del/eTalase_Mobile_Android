import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Controller('admin/plans')
export class PlansAdminController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  private guard(key: string) {
    if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
      throw new ForbiddenException();
    }
  }

  @Get()
  getPlans(@Headers('x-admin-key') key: string) {
    this.guard(key);
    return this.subscriptions.getPlanAdminConfig();
  }

  @Patch(':planKey')
  updatePlan(
    @Param('planKey') planKey: string,
    @Body() updates: Record<string, unknown>,
    @Headers('x-admin-key') key: string,
  ) {
    this.guard(key);
    return this.subscriptions.updatePlanConfig(planKey, updates as any);
  }

  @Post('cancel-stale')
  cancelStale(@Headers('x-admin-key') key: string) {
    this.guard(key);
    return this.subscriptions.cancelStalePendingSubscriptions();
  }
}
