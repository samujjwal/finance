import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  MaxLength,
  Matches,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ description: "Username" })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: "Password" })
  @IsString()
  @MinLength(6)
  @MaxLength(10)
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    description:
      "User ID (max 15 chars, alphanumeric with hyphens/underscores)",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(15)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  userId: string;

  @ApiProperty({ description: "Username" })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: "Email" })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      "Password (6-10 chars, must contain uppercase, lowercase, number)",
  })
  @IsString()
  @MinLength(6)
  @MaxLength(10)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;

  @ApiProperty({ description: "First name" })
  @IsString()
  firstName: string;

  @ApiProperty({ description: "Surname" })
  @IsString()
  surname: string;

  @ApiProperty({ description: "Branch ID", required: false })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({
    description: "User type ID (ADMIN, MGR, OPR, VIEW)",
    required: false,
  })
  @IsOptional()
  @IsString()
  userTypeId?: string;
}
