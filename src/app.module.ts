import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { SessionModule } from './session/session.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [PrismaModule, UserModule, SessionModule, TransactionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
