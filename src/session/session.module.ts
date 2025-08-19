import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TransactionModule } from 'src/transaction/transaction.module';

@Module({
  imports: [PrismaModule, TransactionModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService]
})
export class SessionModule {}
