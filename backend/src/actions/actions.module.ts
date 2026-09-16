import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ActionsService } from './actions.service';
import { ActionsController } from './actions.controller';
import { PointtransactionModule } from '../pointtransaction/pointtransaction.module';


@Module({
  imports: [
    PrismaModule,
    PointtransactionModule,
  ],
  providers: [ActionsService],
  controllers: [ActionsController]
})
export class ActionsModule {}
