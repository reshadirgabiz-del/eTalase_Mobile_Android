import { IsArray, ValidateNested, IsString, IsInt, Min, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class OrderLinkItemDto {
  @IsString() productId: string;
  @IsInt() @Min(1) quantity: number;
}

export class CreateOrderLinkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderLinkItemDto)
  items: OrderLinkItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  message?: string;

  @IsOptional()
  @IsBoolean()
  isPermanent?: boolean;
}
