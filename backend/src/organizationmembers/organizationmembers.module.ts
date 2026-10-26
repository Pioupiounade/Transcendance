import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationmembersService } from './organizationmembers.service';
import { OrganizationmembersController } from './organizationmembers.controller';
import { PointtransactionModule } from 'src/pointtransaction/pointtransaction.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    PrismaModule,
    PointtransactionModule,
    NotificationsModule,
    RealtimeModule,
  ],
  providers: [OrganizationmembersService],
  controllers: [OrganizationmembersController]
})
export class OrganizationmembersModule {}
