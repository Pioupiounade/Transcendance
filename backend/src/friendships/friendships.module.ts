import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FriendshipsService } from './friendships.service';
import { FriendshipsController } from './friendships.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PrismaModule, RealtimeModule],
  providers: [FriendshipsService],
  controllers: [FriendshipsController]
})
export class FriendshipsModule {}
