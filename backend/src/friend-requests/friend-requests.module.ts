import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FriendRequestsService } from './friend-requests.service';
import { FriendRequestsController } from './friend-requests.controller';

@Module({
  imports: [PrismaModule],
  providers: [FriendRequestsService],
  controllers: [FriendRequestsController]
})
export class FriendRequestsModule {}
