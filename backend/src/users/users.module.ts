import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PointtransactionModule } from '../pointtransaction/pointtransaction.module';

@Module({
  imports: [
    PrismaModule,
    PointtransactionModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}