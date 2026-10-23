import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ActionsModule } from './actions/actions.module';
import { ProfilesModule } from './profiles/profiles.module';
import { InterestsModule } from './interests/interests.module';
import { FriendRequestsModule } from './friend-requests/friend-requests.module';
import { FriendshipsModule } from './friendships/friendships.module';
import { ParticipationsModule } from './participations/participations.module';
import { OrganizationmembersModule } from './organizationmembers/organizationmembers.module';
import { PointtransactionModule } from './pointtransaction/pointtransaction.module';
import { AuthModule } from "./auth/auth.module";
import { NotificationsModule } from './notifications/notifications.module';
import { DirectMessagesModule } from './directmessages/directmessages.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/static',
    }),
    PrismaModule,
    ScheduleModule.forRoot(),
    UsersModule,
    OrganizationsModule,
    ActionsModule,
    ProfilesModule,
    InterestsModule,
    FriendRequestsModule,
    FriendshipsModule,
    ParticipationsModule,
    OrganizationmembersModule,
    PointtransactionModule,
    AuthModule,
    NotificationsModule,
    DirectMessagesModule,
    RealtimeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}