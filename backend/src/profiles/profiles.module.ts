import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PrismaModule, RealtimeModule],
  providers: [ProfilesService],
  controllers: [ProfilesController]
})
export class ProfilesModule {}
