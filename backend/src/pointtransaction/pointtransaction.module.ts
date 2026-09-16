import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PointtransactionService } from './pointtransaction.service';
import { PointtransactionController } from './pointtransaction.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PointtransactionController],
  providers: [PointtransactionService],
  exports: [PointtransactionService],
})
export class PointtransactionModule {}
