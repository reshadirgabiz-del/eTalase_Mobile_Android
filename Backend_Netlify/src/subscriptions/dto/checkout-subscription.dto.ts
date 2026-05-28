import { IsIn, IsOptional, IsString } from 'class-validator';

export class CheckoutSubscriptionDto {
  @IsString()
  @IsIn(['starter', 'growth', 'business'])
  plan: string;

  @IsOptional()
  @IsString()
  voucherCode?: string;
}
