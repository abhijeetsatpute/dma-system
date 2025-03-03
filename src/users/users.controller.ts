import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from './entities/user.entity';
import { AuthGuard } from '../core/guards/auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decoraters/roles.decorater';

import {
  Controller,
  Post,
  Body,
  Request,
  Get,
  UseGuards,
} from '@nestjs/common';

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

  // testing auth apis
  @Get('/whoiam')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('viewer', 'editor', 'admin')
  @ApiBearerAuth('JWT-auth')
  async whoiam(@Request() req) {
    return {
      message: `hi ${req.user.email} with role ${req.user.roles}, you can access protected API !`,
    };
  }
}
