import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { SessionService } from 'src/session/session.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('GameService', () => {
  let gameService: GameService;
  let mockSessionService ={
    getSession: jest.fn(),
    updateCredits: jest.fn()
  };
  let mockPrisma = {
    $transaction: jest.fn()
  };
  let mockTransactionService = {
    createRollTransaction: jest.fn()
  };

  const mockSession = {
    id: 1,
    status: 'active',
    credits: 10,
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {provide: SessionService, useValue:mockSessionService},
        {provide: PrismaService, useValue: mockPrisma},
        {provide: TransactionService, useValue: mockTransactionService}
      ],
    }).compile();
    mockPrisma.$transaction = jest.fn().mockImplementation(async (cb) => {
      return cb(mockPrisma); 
    });
    gameService = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(gameService).toBeDefined();
  });

  describe('Testing method roll', () =>{
    it('should throw NotFoundException if session not found', async () => {
      mockSessionService.getSession.mockResolvedValueOnce(null);

      await expect(gameService.roll(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if session is not active', async () => {
      mockSessionService.getSession.mockResolvedValueOnce({ ...mockSession, status: 'closed' });

      await expect(gameService.roll(1)).rejects.toThrow(BadRequestException);
    });

    it('should return win result and update credits', async () => {
      jest.spyOn(global.Math, 'random').mockReturnValue(0); 
      mockSessionService.getSession.mockResolvedValueOnce(mockSession);

      const result = await gameService.roll(1);

      expect(result.credits).toBeGreaterThan(mockSession.credits); 
      expect(mockSessionService.updateCredits).toHaveBeenCalled();
      expect(mockTransactionService.createRollTransaction).toHaveBeenCalled();
      jest.spyOn(global.Math, 'random').mockRestore();
    });

    it('should reduce credits on lose', async () => {
      jest.spyOn(gameService as any, 'generateRollResult').mockReturnValue(['C', 'L', 'O']);
      mockSessionService.getSession.mockResolvedValueOnce(mockSession);

      const result = await gameService.roll(1);

      expect(result.win).toBe(false);
      expect(result.credits).toBe(mockSession.credits - 1);
      expect(mockSessionService.updateCredits).toHaveBeenCalled();
    });

    it('should set credits to 0 if game over', async () => {
      mockSessionService.getSession.mockResolvedValueOnce({ ...mockSession, credits: 1 });
      jest.spyOn(gameService as any, 'generateRollResult').mockReturnValue(['C', 'L', 'O']);

      const result = await gameService.roll(1);

      expect(result.credits).toBe(0);
      expect(result.win).toBe(false);
      expect(mockSessionService.updateCredits).toHaveBeenCalledWith(expect.anything(), 1, 0, true);
    });

    it('should not apply jackpot logic if credits are below 40', async () => {
      mockSessionService.getSession.mockResolvedValueOnce({ ...mockSession, credits: 30 });
      jest.spyOn(gameService as any, 'generateRollResult').mockReturnValue(['C', 'C', 'C']);
      const spyHandleJackpot = jest.spyOn(gameService as any, 'handleJackpot');

      const result = await gameService.roll(1);

      expect(result.win).toBe(true);
      expect(result.credits).toBe(30 + gameService.rewards.C);
      expect(spyHandleJackpot).toHaveBeenCalled();
    });

    it('should re-roll and result in a loss if jackpot is triggered with credits >= 60', async () => {
      mockSessionService.getSession.mockResolvedValueOnce({ ...mockSession, credits: 65 });
      jest.spyOn(gameService as any, 'generateRollResult').mockReturnValue(['C', 'C', 'C']);
      jest.spyOn(global.Math, 'random').mockReturnValue(0.5);

      const result = await gameService.roll(1);

      expect(result.win).toBe(false);
      expect(result.credits).toBe(65 - 1);
    });

    it('should not trigger jackpot when credits are >= 60 and chance fails', async () => {
      mockSessionService.getSession.mockResolvedValueOnce({ ...mockSession, credits: 65 });
      
      jest.spyOn(gameService as any, 'generateRollResult').mockReturnValue(['C', 'C', 'C']);
      
      jest.spyOn(global.Math, 'random').mockReturnValue(0.7);

      const result = await gameService.roll(1);

      expect(result.win).toBe(true);
      expect(result.credits).toBe(65 + gameService.rewards.C);
    });

    it('should re-roll and result in a loss if jackpot is triggered with credits between 40 and 60', async () => {

        mockSessionService.getSession.mockResolvedValueOnce({ ...mockSession, credits: 50 });
        
        jest.spyOn(gameService as any, 'generateRollResult').mockReturnValue(['L', 'L', 'L']);
        
        jest.spyOn(global.Math, 'random').mockReturnValue(0.2);

        const result = await gameService.roll(1);
        expect(result.win).toBe(false);
        expect(result.credits).toBe(50 - 1);
    });

    it('should not trigger jackpot when credits are between 40 and 60 and chance fails', async () => {
      mockSessionService.getSession.mockResolvedValueOnce({ ...mockSession, credits: 50 });
      
      jest.spyOn(gameService as any, 'generateRollResult').mockReturnValue(['L', 'L', 'L']);
      
      jest.spyOn(global.Math, 'random').mockReturnValue(0.4);

      const result = await gameService.roll(1);

      expect(result.win).toBe(true);
      expect(result.credits).toBe(50 + gameService.rewards.L);
   });
  })
});