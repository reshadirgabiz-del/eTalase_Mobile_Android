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
  @IsString() description: string;
  @IsNumber() price: number;
  @IsString() imageUrl: string;
  @IsInt() @Min(0) stock: number;
  @IsArray() @IsString({ each: true }) tags: string[];
  @IsBoolean() isActive: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}
