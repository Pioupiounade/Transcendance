import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ActionsModule } from './actions/actions.module';

@Module({
  imports: [PrismaModule, UsersModule, OrganizationsModule, ActionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
