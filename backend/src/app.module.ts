import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ActionsModule } from './actions/actions.module';
import { ProfilesModule } from './profiles/profiles.module';
import { InterestsModule } from './interests/interests.module';

@Module({
  imports: [PrismaModule, UsersModule, OrganizationsModule, ActionsModule, ProfilesModule, InterestsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
