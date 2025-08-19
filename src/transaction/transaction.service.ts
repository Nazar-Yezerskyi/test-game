import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async createCashout(
    tx: Prisma.TransactionClient,
    sessionId: number,
    reward: number,
  ) {
    return tx.transaction.create({
      data: {
        sessionId,
        type: 'CASH_OUT',
        reward,
      },
    });
  }
  async createRollTransaction(tx: any, sessionId: number, result: string[], win: boolean, reward: number) {
    return tx.transaction.create({
      data: {
        sessionId,
        type: win ? 'ROLL_WIN' : 'ROLL_LOSS',
        symbols: result.join(','),
        reward: win ? reward : 0, 
      },
    });
  }

}
