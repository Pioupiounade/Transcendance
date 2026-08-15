import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ActionsService } from './actions.service';
import { ActionsController } from './actions.controller';

@Module({
  imports: [PrismaModule],
  providers: [ActionsService],
  controllers: [ActionsController]
})
export class ActionsModule {}
