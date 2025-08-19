import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SessionModule } from 'src/session/session.module';
import { TransactionModule } from 'src/transaction/transaction.module';

@Module({
  imports: [PrismaModule, SessionModule, TransactionModule],
  controllers: [GameController],
  providers: [GameService]
})
export class GameModule {}
