import { Module } from '@nestjs/common';
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


@Module({
  imports: [PrismaModule, UsersModule, OrganizationsModule, ActionsModule, ProfilesModule, InterestsModule, FriendRequestsModule, FriendshipsModule, ParticipationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
