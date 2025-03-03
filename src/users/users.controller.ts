import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body, Request } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from './entities/user.entity';

@ApiTags('Auth / User Management')
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/signup')
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Create a new user account with name, email, role and password.',
  })
  async create(
    @Request() req,
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ result: User; message: string }> {
    const user = await this.usersService.createUser(createUserDto);
    return { result: user, message: 'User created successfully.' };
  }

  @Post('/login')
  @ApiOperation({
    summary: 'User Login',
    description: 'Login with email and password.',
  })
  async login(@Body() authDto: LoginUserDto) {
    const result = await this.usersService.validateUser(
      authDto.email,
      authDto.password,
    );
    return { result, message: 'User validated successfully.' };
  }
}
