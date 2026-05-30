import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SocialLinkDto {
  @IsString() platform: string;
  @IsString() url: string;
}

export class UpdateSettingsDto {
  @IsOptional() @IsString() storeName?: string;
  @IsOptional() @IsString() storeDescription?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() midtransServerKey?: string;
  @IsOptional() @IsString() midtransClientKey?: string;
  @IsOptional() @IsString() originAddress?: string;
  @IsOptional() @IsString() originCity?: string;
  @IsOptional() @IsString() originProvince?: string;
  @IsOptional() @IsString() originPostalCode?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) enabledCouriers?: string[];

  // Bank transfer
  @IsOptional() @IsBoolean() bankTransferEnabled?: boolean;
  @IsOptional() @IsString() bankTransferText?: string;
  @IsOptional() @IsString() bankAccountNumber?: string;
  @IsOptional() @IsString() bankRecipientName?: string;
  @IsOptional() @IsString() bankName?: string;

  // Currency
  @IsOptional() @IsString() currency?: string;

  // Flat-rate delivery
  @IsOptional() @IsBoolean() flatRateDeliveryEnabled?: boolean;
  @IsOptional() @IsNumber() flatRateDeliveryPrice?: number;
  @IsOptional() @IsString() flatRateDeliveryName?: string;

  // Social links
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];
}
