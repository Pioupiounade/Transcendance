import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationmembersService } from './organizationmembers.service';
import { OrganizationmembersController } from './organizationmembers.controller';

@Module({
  imports: [PrismaModule],
  providers: [OrganizationmembersService],
  controllers: [OrganizationmembersController]
})
export class OrganizationmembersModule {}
