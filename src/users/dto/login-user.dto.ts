import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    default: 'admin@mail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  readonly email: string;

  @ApiProperty({
    default: 'Password@123',
  })
  @IsString()
  @IsNotEmpty()
  readonly password: string;
}
