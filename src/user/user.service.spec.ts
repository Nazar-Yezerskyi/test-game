import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConflictException } from '@nestjs/common';

describe('UserService', () => {
  let userService: UserService;
  const mockPrisma = {
    user:{
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
  let mockUser = {
    id: 1,
    email: 'test@gmail.com',
    createdAt: new Date('08-18-2025')
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {provide: PrismaService, useValue: mockPrisma}
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('Testing method findByEmail', ()=>{
    it('should find and return user by email', async ()=>{
      mockPrisma.user.findUnique =jest.fn().mockResolvedValueOnce(mockUser)
      const result = await userService.findByEmail(mockUser.email)
      expect(result).toEqual(mockUser)
      expect(mockPrisma.user.findUnique).toHaveBeenCalled()
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: mockUser.email
        }
      }) 
    })
    it('should return a empty object if user does not exisit', async() =>{
      mockPrisma.user.findUnique =jest.fn().mockResolvedValueOnce({})
      const result = await userService.findByEmail(mockUser.email)
      expect(result).toEqual({})
      expect(mockPrisma.user.findUnique).toHaveBeenCalled()
    })
  })
  describe('Testing method createUser', ()=>{
    it('should create and return user', async() =>{
      userService.findByEmail = jest.fn().mockResolvedValueOnce(null)
      mockPrisma.user.create = jest.fn().mockResolvedValueOnce(mockUser)
      const result = await userService.createUser(mockUser.email)
      expect(result).toEqual(mockUser)
      expect(mockPrisma.user.create).toHaveBeenCalled()
    })

    it('should throw ConflictExeption', async ()=>{
      jest.spyOn(userService, 'findByEmail').mockResolvedValueOnce(mockUser)
      await expect(userService.createUser(mockUser.email)).rejects.toThrow(ConflictException)
    })
  })
});
