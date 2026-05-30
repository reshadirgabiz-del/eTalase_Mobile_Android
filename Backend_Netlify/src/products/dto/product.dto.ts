import {
  IsString,
  IsNumber,
  IsInt,
  IsBoolean,
  IsArray,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString() name: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsString() description: string;
  @IsNumber() price: number;
  @IsOptional() @IsNumber() @Min(0) discountedPrice?: number;
  @IsString() imageUrl: string;
  @IsInt() @Min(0) stock: number;
  @IsArray() @IsString({ each: true }) tags: string[];
  @IsBoolean() isActive: boolean;
  @IsOptional() @IsInt() @Min(500) weightGrams?: number;
}

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsNumber() @Min(0) discountedPrice?: number | null;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(500) weightGrams?: number;
}
