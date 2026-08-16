import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FriendshipsService } from './friendships.service';
import { FriendshipsController } from './friendships.controller';

@Module({
  imports: [PrismaModule],
  providers: [FriendshipsService],
  controllers: [FriendshipsController]
})
export class FriendshipsModule {}
