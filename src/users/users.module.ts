import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { User } from './entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    JwtModule.register({ global: true }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
