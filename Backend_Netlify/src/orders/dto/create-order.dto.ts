import {
  IsString,
  IsArray,
  IsNumber,
  IsInt,
  IsOptional,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddAttachmentDto {
  @IsString() filename: string;
  @IsOptional() @IsNumber() size?: number;
  @IsOptional() @IsString() uploadedBy?: string;
  @IsOptional() @IsString() uploadedAt?: string;
  @IsOptional() @IsString() url?: string;
}

class OrderItemDto {
  @IsString() productId: string;
  @IsInt() @Min(1) quantity: number;
}

class AddressDto {
  @IsString() recipientName: string;
  @IsString() phone: string;
  @IsString() street: string;
  @IsString() city: string;
  @IsString() province: string;
  @IsString() postalCode: string;
  @IsOptional() @IsString() notes?: string;
}

class DeliveryOptionDto {
  @IsString() courierId: string;
  @IsString() courierName: string;
  @IsString() courierCode: string;
  @IsString() serviceName: string;
  @IsString() serviceType: string;
  @IsNumber() price: number;
  @IsString() estimatedDays: string;
}

export class CreateOrderDto {
  @IsString() storeId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ValidateNested()
  @Type(() => DeliveryOptionDto)
  deliveryOption: DeliveryOptionDto;
}

export class UpdateOrderStatusDto {
  @IsString() status: string;
}
