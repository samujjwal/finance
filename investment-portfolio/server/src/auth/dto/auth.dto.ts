import { IsString, IsEmail, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Username' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: 'Password' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ description: 'Username' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: 'Email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'User role', enum: ['ADMIN', 'EDITOR', 'VIEWER', 'READ_ONLY', 'USER'], required: false })
  @IsOptional()
  @IsEnum(['ADMIN', 'EDITOR', 'VIEWER', 'READ_ONLY', 'USER'])
  role?: string;
}
