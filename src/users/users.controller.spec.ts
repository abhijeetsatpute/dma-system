import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from './entities/user.entity';
import { ConflictException, HttpException } from '@nestjs/common';

const mockUser = {
  id: 1,
  username: 'john_doe',
  email: 'john@example.com',
  password: 'hashedPassword',
  role: 'admin',
};

const mockCreateUserDto: CreateUserDto = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'admin',
};

const mockLoginUserDto: LoginUserDto = {
  email: 'john@example.com',
  password: 'password123',
};

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    createUser: jest.fn().mockResolvedValue(mockUser),
    validateUser: jest.fn().mockResolvedValue({
      accessToken: 'validAccessToken',
      user: mockUser,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a user', async () => {
      const result = await controller.create(null, mockCreateUserDto);
      expect(result).toEqual({
        result: mockUser,
        message: 'User created successfully.',
      });
      expect(mockUsersService.createUser).toHaveBeenCalledWith(
        mockCreateUserDto,
      );
    });

    it('should throw an error if user already exists', async () => {
      mockUsersService.createUser.mockRejectedValueOnce(
        new ConflictException('Email is already in use'),
      );

      try {
        await controller.create(null, mockCreateUserDto);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe('Email is already in use');
      }
    });
  });

  describe('login', () => {
    it('should successfully log in a user and return a token', async () => {
      const result = await controller.login(mockLoginUserDto);
      expect(result).toEqual({
        result: {
          accessToken: 'validAccessToken',
          user: mockUser,
        },
        message: 'User validated successfully.',
      });
      expect(mockUsersService.validateUser).toHaveBeenCalledWith(
        mockLoginUserDto.email,
        mockLoginUserDto.password,
      );
    });

    it('should throw an error if invalid email or password', async () => {
      mockUsersService.validateUser.mockRejectedValueOnce(
        new HttpException('Email or password is incorrect', 400),
      );

      try {
        await controller.login(mockLoginUserDto);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toBe('Email or password is incorrect');
      }
    });
  });
});
