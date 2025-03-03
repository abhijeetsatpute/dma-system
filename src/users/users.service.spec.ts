import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/sequelize';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRATION } from '../config';

// Mock User data
const mockUser = {
  id: 1,
  username: 'john_doe',
  email: 'john@example.com',
  password: 'hashedPassword',
  role: 'admin',
};

const mockCreateUserDto = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'admin',
};

// Mock bcrypt comparison
jest.mock('bcrypt');
jest.mock('@nestjs/jwt');

describe('UsersService', () => {
  let service: UsersService;
  let jwtService: JwtService;
  let userRepository: any;

  const mockUserRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    sequelize: {
      transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('accessToken') },
        },
        {
          provide: getModelToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    userRepository = module.get(getModelToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should successfully create a user', async () => {
      jest.spyOn(userRepository, 'create').mockResolvedValueOnce(mockUser);

      const result = await service.createUser(mockCreateUserDto);
      expect(result).toEqual(mockUser);
      expect(userRepository.create).toHaveBeenCalledWith(
        mockCreateUserDto,
        expect.any(Object),
      );
    });

    it('should throw a ConflictException if the email already exists', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      try {
        await service.createUser(mockCreateUserDto);
      } catch (error) {
        expect(error.message).toBe('Email is already in use');
      }
    });

    it('should handle errors and rollback transaction if user creation fails', async () => {
      userRepository.create.mockRejectedValueOnce(
        new Error('Error creating user'),
      );

      try {
        await service.createUser(mockCreateUserDto);
      } catch (error) {
        expect(error.message).toBe('Error creating user');
      }
    });
  });

  describe('validateUser', () => {
    it('should return access token and user info for valid login', async () => {
      bcrypt.compare.mockResolvedValue(true);
      userRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.validateUser(mockUser.email, 'password123');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { id: mockUser.id, email: mockUser.email },
        { secret: ACCESS_TOKEN_SECRET, expiresIn: ACCESS_TOKEN_EXPIRATION },
      );
    });

    it('should throw HttpException if email or password is incorrect', async () => {
      bcrypt.compare.mockResolvedValue(false);

      try {
        await service.validateUser(mockUser.email, 'wrongPassword');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toBe('Email or password is incorrect');
      }
    });

    it('should throw HttpException if user is not found', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);

      try {
        await service.validateUser(mockUser.email, 'password123');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toBe('Email or password is incorrect');
      }
    });

    it('should throw HttpException if password is null', async () => {
      userRepository.findOne.mockResolvedValueOnce({
        ...mockUser,
        password: null,
      });

      try {
        await service.validateUser(mockUser.email, 'password123');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toBe('Check your login method');
      }
    });
  });
});
