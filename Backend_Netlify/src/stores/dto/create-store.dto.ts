import { IsString, IsOptional } from 'class-validator';

export class CreateStoreDto {
  @IsString() name: string;
  @IsOptional() @IsString() storePhotoUrl?: string;
}
