import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionService } from 'src/session/session.service';
import { TransactionService } from 'src/transaction/transaction.service';

@Injectable()
export class GameService {
  symbols = ['C', 'L', 'O', 'W'];
  rewards = { C: 10, L: 20, O: 30, W: 40 };

  constructor(
    private sessionService: SessionService,
    private prisma: PrismaService,
    private transactionService: TransactionService
  ) {}

  async roll(sessionId: number){
    const session = await this.sessionService.getSession(sessionId);

    if (!session) {
      throw new NotFoundException(`Session with id ${sessionId} not found`);
    }

    if (session.status !== 'active') {
      throw new BadRequestException('Session is not active');
    }

    let result = this.generateRollResult();
    let { win, reward } = this.calculateReward(result);
    const { newResult, newWin, newReward } = this.handleJackpot(session.credits, result, win, reward);
    result = newResult;
    win = newWin;
    reward = newReward;

    let updatedCredits = win ? session.credits + reward : session.credits - 1;
    const isGameOver = updatedCredits <= 0;
    if (isGameOver){ 
      updatedCredits = 0;
    }

    await this.updateSessionAndLogTransaction(sessionId, updatedCredits, result, win, reward,isGameOver);

    return { result, win, reward, credits: updatedCredits };
  }

  private generateRollResult() {
    return [
      this.getRandomSymbol(),
      this.getRandomSymbol(),
      this.getRandomSymbol(),
    ];
  }
  private getRandomSymbol(){
    return this.symbols[Math.floor(Math.random() * this.symbols.length)];
  }

  private calculateReward(result: string[]) {
    const win = result[0] === result[1] && result[1] === result[2];
    const reward = win ? this.rewards[result[0]] : 0;
    return { win, reward };
  }

  private handleJackpot(credits: number, result: string[], win: boolean, reward: number){
    if (!win) {
      return { newResult: result, newWin: win, newReward: reward };
    }

    let chance = 0;
    if (credits >= 40 && credits < 60) {
      chance = 0.3;
    }
    if (credits >= 60) {
      chance = 0.6;
    }

    if (Math.random() < chance) {
      return { newResult: this.generateRollResult(), newWin: false, newReward: 0 };
    }

    return { newResult: result, newWin: win, newReward: reward };
  }
  private async updateSessionAndLogTransaction(
    sessionId: number,
    updatedCredits: number,
    result: string[],
    win: boolean,
    reward: number,
    gameOver: boolean,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await this.sessionService.updateCredits(tx, sessionId, updatedCredits, gameOver);
      await this.transactionService.createRollTransaction(tx, sessionId, result, win, reward);
    });
   }
}
