import { Module } from '@nestjs/common';
import { PointtransactionService } from './pointtransaction.service';
import { PointtransactionController } from './pointtransaction.controller';

@Module({
  providers: [PointtransactionService],
  controllers: [PointtransactionController]
})
export class PointtransactionModule {}
