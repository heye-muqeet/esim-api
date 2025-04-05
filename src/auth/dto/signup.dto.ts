import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}