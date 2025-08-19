import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionService } from 'src/transaction/transaction.service';

describe('SessionService', () => {
  let sessionService: SessionService;
  let mockPrisma = {
    session:{
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    $transaction: jest.fn()
  }
  let mockTransactionService = {
    createCashout: jest.fn()
  }
  

  const mockSession = {
    id: 1,
    userId: 1,
    credits: 100,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [
      {
        id: 1,
        sessionId: 1,
        type: 'ROLL_WIN',
        symbols: 'C,C,C',
        reward: 50,
        createdAt: new Date(),
      },
    ],
    user: {
      id: 1,
      email: 'test@example.com',
      createdAt: new Date(),
    },
  };
  const mockTx = {
      session: {
        update: jest.fn().mockResolvedValue({
          ...mockSession,
          status: 'closed',
          credits: 0
        })
      }
    };

  const mockSessions = [mockSession]

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
      { provide: PrismaService, useValue: mockPrisma},
      { provide: TransactionService, useValue: mockTransactionService}
    ],
    }).compile();

    sessionService = module.get<SessionService>(SessionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(sessionService).toBeDefined();
  });

  describe('Testing method findSessionsByUserId', () =>{
    it('should find and return session by userId', async() =>{
      const userId = 1
      mockPrisma.session.findMany.mockResolvedValueOnce(mockSessions)
      const result = await sessionService.findSessionsByUserId(userId)
      expect(mockPrisma.session.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSessions);
    })
  })

  describe('Testing method createSessionForUser', () =>{
    it('should create and return session for user', async() =>{
      const userId = 1
      mockPrisma.session.create.mockResolvedValueOnce(mockSessions)
      const result = await sessionService.createSessionForUser(userId)
      expect(mockPrisma.session.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSessions);
    })
  })

  describe('Testing method getSession', () =>{
    it('should return a session with user and transactions', async () => {
      const sessionId = 1;
      mockPrisma.session.findUnique.mockResolvedValue(mockSessions);
      const result = await sessionService.getSession(sessionId);

      expect(mockPrisma.session.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
        include: { 
          user: true,
          transactions: true 
        },
      });
      expect(result).toEqual(mockSessions);
    });
  })
  describe('Testing method cashout', ()=>{
    it('should process cashout for active session', async () =>{
      const sessionId = 1
      mockPrisma.session.findUnique.mockResolvedValue(mockSession);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });
      mockTransactionService.createCashout.mockResolvedValue({});

      const result = await sessionService.cashout(sessionId);

      expect(mockPrisma.session.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: sessionId },
        include: { user: true, transactions: true }
      });

      expect(mockTransactionService.createCashout).toHaveBeenCalledWith(
        mockTx,
        sessionId,
        mockSession.credits
      );
      expect(mockTx.session.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: { status: 'closed', credits: 0 }
      });
      expect(result).toEqual({
        ...mockSession,
        status: 'closed',
        credits: 0
      });
    })
  });
  describe('Testing private closeSession method', () => {
    it('should close session with zero credits', async () => {
      const sessionId = 1;
      
      const closeSession = (sessionService as any).closeSession.bind(sessionService);

      const result = await closeSession(mockTx, sessionId);

      expect(mockTx.session.update).toHaveBeenCalledTimes(1);
      expect(mockTx.session.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: {
          status: 'closed',
          credits: 0
        }
      });
      expect(result).toEqual({
        ...mockSession,
        status: 'closed',
        credits: 0
      });
    });
  });

  describe('Testing method updateCredits', () =>{
    it('should update credits and set status to active if gameOver is false', async() =>{
    const sessionId = 1;
    const updatedCredits = 150;
    const gameOver = false;
    
    const mockTx = {
      session: {
        update: jest.fn().mockResolvedValue({
          ...mockSession,
          credits: updatedCredits,
          status: 'active'
        })
      }
    };
    
    const result = await sessionService.updateCredits(mockTx, sessionId, updatedCredits, gameOver);
    
    expect(mockTx.session.update).toHaveBeenCalledTimes(1);
    expect(mockTx.session.update).toHaveBeenCalledWith({
      where: { id: sessionId },
      data: {
        credits: updatedCredits,
        status: 'active'
      }
    });
    expect(result.credits).toBe(updatedCredits);
    expect(result.status).toBe('active');
  });

  it('should update credits and set status to closed if gameOver is true', async() =>{
    const sessionId = 1;
    const updatedCredits = 0;
    const gameOver = true;
  
    const result = await sessionService.updateCredits(mockTx, sessionId, updatedCredits, gameOver);
    
    expect(mockTx.session.update).toHaveBeenCalledTimes(1);
    expect(mockTx.session.update).toHaveBeenCalledWith({
      where: { id: sessionId },
      data: {
        credits: updatedCredits,
        status: 'closed'
      }
    });
    expect(result.credits).toBe(updatedCredits);
    expect(result.status).toBe('closed');
  });
  })
});
