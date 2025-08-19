import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let prismaMock: PrismaService

  const mockCashout = {
    id: 1,
    sessionId: 123,
    type: 'CASH_OUT',
    reward: 50,
    createdAt: new Date(),
  };
    const mockTx = {
    transaction: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn().mockImplementation(async (callback) => {
              return callback(mockTx);
            }),
          },
        },
      ],
    }).compile();
    
    transactionService = module.get<TransactionService>(TransactionService);
    prismaMock = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(transactionService).toBeDefined();
  });
  describe('Testing method createCashout', () => {
    it('should create and return cashout', async () => {
      const sessionId = 123;
      const reward = 50.0;
      
      mockTx.transaction.create.mockResolvedValue(mockCashout);

      const result = await transactionService.createCashout(
        mockTx as unknown as Prisma.TransactionClient,
        sessionId,
        reward,
      );

      expect(mockTx.transaction.create).toHaveBeenCalledTimes(1);
      expect(mockTx.transaction.create).toHaveBeenCalledWith({
        data: {
          sessionId,
          type: 'CASH_OUT',
          reward,
        },
      });
      
      expect(result).toEqual(mockCashout);
    });

    it('should throw an error if the Prisma operation fails', async () => {
      const sessionId = 123;
      const reward = 50.0;
      const prismaError = new Error('Prisma database error');

      mockTx.transaction.create.mockRejectedValue(prismaError);

      await expect(
        transactionService.createCashout(
          mockTx as unknown as Prisma.TransactionClient,
          sessionId,
          reward,
        )
      ).rejects.toThrow(prismaError);

      expect(mockTx.transaction.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Testing method createRollTransaction', () => {
    const sessionId = 1;
    
    it('should create a ROLL_WIN transaction when win is true', async () => {
      const result = ['C', 'C', 'C'];
      const reward = 10;
      const win = true;
      const expectedData = {
        sessionId,
        type: 'ROLL_WIN',
        symbols: result.join(','),
        reward,
      };

      mockTx.transaction.create.mockResolvedValue(expectedData);

      const transaction = await transactionService.createRollTransaction(
        mockTx as any,
        sessionId,
        result,
        win,
        reward,
      );

      expect(transaction).toEqual(expectedData);
      expect(mockTx.transaction.create).toHaveBeenCalledWith({
        data: expectedData,
      });
    });

    it('should create a ROLL_LOSS transaction when win is false', async () => {
      const result = ['C', 'W', 'C'];
      const win = false;
      const reward = 10;
      const expectedData = {
        sessionId,
        type: 'ROLL_LOSS',
        symbols: result.join(','),
        reward: 0, 
      };

      mockTx.transaction.create.mockResolvedValue(expectedData);

      const transaction = await transactionService.createRollTransaction(
        mockTx as any,
        sessionId,
        result,
        win,
        reward, 
      );

      expect(transaction).toEqual(expectedData);
      expect(mockTx.transaction.create).toHaveBeenCalledWith({
        data: expectedData,
      });
    });
  });
});