import { IsString, IsNumber } from 'class-validator';

export class DeliveryEstimateDto {
  @IsString() storeId: string;
  @IsString() destinationAddress: string;
  @IsNumber() destinationLat: number;
  @IsNumber() destinationLng: number;
  @IsNumber() totalWeightGrams: number;
}
