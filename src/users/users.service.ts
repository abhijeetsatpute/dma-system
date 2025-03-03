import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';
import { UpdateUserDto } from './dto/update-user.dto';
import { Op, Transaction } from 'sequelize';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRATION } from '../config';

import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly jwtService: JwtService,

    @InjectModel(User)
    private userRepository: typeof User,
  ) {}

  // Method to create a new user
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { username, email, password, role } = createUserDto;

    const transaction = await this.userRepository.sequelize.transaction();
    try {
      // Check if the user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email },
        transaction,
      });

      if (existingUser) {
        throw new ConflictException('Email is already in use');
      }

      // Create the user
      const user = await this.userRepository.create(
        {
          username,
          email,
          password,
          role,
        },
        { transaction },
      );

      await transaction.commit();
      this.logger.log('User created successfully for:', user.email);
      return user;
    } catch (error) {
      // Rollback the transaction if any operation fails
      await transaction.rollback();
      this.logger.error(UsersService.name, {
        message: `Error in createUser:${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        raw: true,
      });

      let tokens = null;

      if (!user) {
        throw new HttpException(
          'Email or password is incorrect',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (user.password === null) {
        throw new HttpException(
          'Check your login method',
          HttpStatus.BAD_REQUEST,
        );
      }

      const isValidPassword: boolean = await bcrypt.compare(
        password,
        user.password,
      );

      if (isValidPassword) {
        //TODO generate token only if user is verified

        const payload = {
          id: user.id,
          email: user.email,
          roles: [user.role],
        };
        tokens = await this.getTokens(payload);

        delete user.password;

        this.logger.log(`User logged in successfully for: ${user.email}`);

        return {
          ...tokens,
          user: {
            ...user,
          },
        };
      } else {
        throw new HttpException(
          'Email or password is incorrect',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      this.logger.error(UsersService.name, {
        message: `Error in createUser:${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // fetch all users users except userId
  async getAllUsers(userId: number): Promise<User[]> {
    try {
      const users = await this.userRepository.findAll({
        where: {
          id: {
            [Op.not]: userId,
          },
        },
        order: [['updatedAt', 'DESC']],
      });

      if (!users.length) {
        throw new NotFoundException('No users present');
      }

      return users;
    } catch (error) {
      this.logger.error('UsersService', {
        message: `Error in getAllUsers: ${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updateUser(userId: number, data: UpdateUserDto): Promise<void> {
    const transaction: Transaction =
      await this.userRepository.sequelize.transaction();
    try {
      const user = await this.userRepository.findByPk(userId, {
        transaction,
      });

      if (!user) {
        throw new NotFoundException('User Not Found');
      }

      await this.userRepository.update(
        {
          ...data,
        },
        {
          where: {
            id: userId,
          },
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      this.logger.error('UsersService', {
        message: `Error in updateUser: ${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async deleteUser(userId: number): Promise<void> {
    const transaction: Transaction =
      await this.userRepository.sequelize.transaction();
    try {
      const user = await this.userRepository.findByPk(userId, {
        transaction,
      });

      if (!user) {
        throw new NotFoundException('User Not Found');
      }

      await this.userRepository.destroy({
        where: {
          id: userId,
        },
      });
    } catch (error) {
      await transaction.rollback();
      this.logger.error('UsersService', {
        message: `Error in deleteUser: ${error}`,
      });
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Generate access token
   * @param payload user object.
   * @returns Promise<{}>
   */
  private async getTokens(payload: any) {
    const [accessToken] = await Promise.all([
      this.generateAccessToken(payload),
    ]);

    return {
      accessToken,
    };
  }

  /**
   * Generate access token
   * @param payload user object.
   * @returns Promise<string>
   */
  private async generateAccessToken(payload: any) {
    return this.jwtService.signAsync(payload, {
      secret: ACCESS_TOKEN_SECRET,
      expiresIn: ACCESS_TOKEN_EXPIRATION,
    });
  }
}
