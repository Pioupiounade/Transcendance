import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}