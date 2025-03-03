import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from './entities/user.entity';
import { AuthGuard } from '../core/guards/auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decoraters/roles.decorater';
import { UpdateUserDto } from './dto/update-user.dto';

import {
  Controller,
  Post,
  Body,
  Request,
  Get,
  UseGuards,
  Put,
  Param,
  Delete,
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
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
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

  @Get('/all-users')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Get all users.',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles('admin')
  async getAllUsers(@Request() req) {
    const result = await this.usersService.getAllUsers(req.user.id);
    return { result };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update User Details',
    description: 'Update User details (username,role)',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async updateUser(@Param('id') userId: number, @Body() data: UpdateUserDto) {
    const response = await this.usersService.updateUser(userId, data);
    return { result: response, message: 'User updated successfully.' };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a User',
    description: 'Delete a User.',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async deleteUser(@Param('id') id: number) {
    const result = await this.usersService.deleteUser(id);
    return { result, message: 'User deleted successfully.' };
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
