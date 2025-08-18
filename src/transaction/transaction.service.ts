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
}
