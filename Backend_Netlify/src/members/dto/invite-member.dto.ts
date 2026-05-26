import { IsEmail, IsString, IsIn } from 'class-validator';

export class InviteMemberDto {
  @IsEmail() email: string;
  @IsString() @IsIn(['admin', 'delivery']) role: string;
}
