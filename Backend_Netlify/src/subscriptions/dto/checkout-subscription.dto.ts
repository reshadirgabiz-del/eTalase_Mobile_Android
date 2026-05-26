import { IsIn, IsString } from 'class-validator';

export class CheckoutSubscriptionDto {
  @IsString()
  @IsIn(['starter', 'growth', 'business'])
  plan: string;
}
