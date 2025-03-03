import * as bcrypt from 'bcrypt';

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
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

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
