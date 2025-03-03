import { Role } from 'src/core/constants';
import { ApiProperty } from '@nestjs/swagger';

import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  NotContains,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    default: 'user1',
  })
  @IsNotEmpty()
  @IsString()
  readonly username: string;

  @ApiProperty({
    default: 'user@mail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  readonly email: string;

  @ApiProperty({
    default: 'Password@123',
  })
  @IsNotEmpty()
  @IsStrongPassword(
    { minLength: 8, minUppercase: 1, minSymbols: 1, minNumbers: 1 },
    {
      message:
        'Password must be at least 8 characters with 1 number, 1 upper case  and 1 special character',
    },
  )
  @NotContains(' ', {
    message: 'Spaces should not be allowed in password field',
  })
  readonly password: string;

  @ApiProperty({
    default: 'viewer',
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(Role)
  role: Role;
}
