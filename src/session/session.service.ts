import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { TransactionService } from 'src/transaction/transaction.service';

@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaService,
    private transactionService: TransactionService
  ){}
  async findSessionsByUserId(userId: number) {
    return this.prisma.session.findMany({
      where: { 
        userId 
      },
      include: { 
        transactions: true 
      },
    });
  }
  async createSessionForUser(userId: number) {
    return this.prisma.session.create({
      data: {
        userId,
        credits: 10,   
        status: 'active',
      },
      include: {
        transactions: true 
      },
    });
  }
  async getSession(sessionId: number) {
    return this.prisma.session.findUnique({
      where: { 
        id: sessionId 
      },
      include: { 
        user: true, 
        transactions: true 
      },
    });
  }

  async cashout(sessionId: number) {
    const session = await this.getSession(sessionId);

    if (!session || session.status !== 'active') return null;

    return this.prisma.$transaction(async (tx) => {
      await this.transactionService.createCashout(tx, sessionId, session.credits);
      return this.closeSession(tx, sessionId);
    });
  }

  private async closeSession(tx: Prisma.TransactionClient, sessionId: number) {
    return tx.session.update({
      where: { id: sessionId },
      data: {
        status: 'closed',
        credits: 0,
      },
    });
  }

  async updateCredits(tx: any, sessionId: number, updatedCredits: number, gameOver: boolean) {
    return tx.session.update({
      where: { id: sessionId },
      data: {
        credits: updatedCredits,
        status: gameOver ? 'closed' : 'active',
      },
    });
  }
}
