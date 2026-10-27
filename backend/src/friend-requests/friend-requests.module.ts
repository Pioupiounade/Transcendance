import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FriendRequestsService } from './friend-requests.service';
import { FriendRequestsController } from './friend-requests.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PrismaModule, NotificationsModule, RealtimeModule],  providers: [FriendRequestsService],
  controllers: [FriendRequestsController]
})
export class FriendRequestsModule {}
