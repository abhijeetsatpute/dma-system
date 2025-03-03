import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Role } from '../../core/constants';

export class UpdateUserDto {
  @ApiProperty({
    default: 'user1',
  })
  @IsNotEmpty()
  @IsString()
  readonly username: string;

  @ApiProperty({
    default: 'viewer',
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(Role)
  role: string;
}
