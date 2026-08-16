import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InterestsService } from './interests.service';
import { InterestsController } from './interests.controller';

@Module({
  imports: [PrismaModule],
  controllers: [InterestsController],
  providers: [InterestsService],

})
export class InterestsModule {}
