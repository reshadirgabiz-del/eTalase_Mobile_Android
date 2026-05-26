import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() storeName?: string;
  @IsOptional() @IsString() storeDescription?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() midtransServerKey?: string;
  @IsOptional() @IsString() midtransClientKey?: string;
  @IsOptional() @IsString() originAddress?: string;
  @IsOptional() @IsNumber() originLat?: number;
  @IsOptional() @IsNumber() originLng?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) enabledCouriers?: string[];
}
