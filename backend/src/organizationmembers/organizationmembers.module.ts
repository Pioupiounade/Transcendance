import { Module } from '@nestjs/common';
import { OrganizationmembersService } from './organizationmembers.service';
import { OrganizationmembersController } from './organizationmembers.controller';

@Module({
  providers: [OrganizationmembersService],
  controllers: [OrganizationmembersController]
})
export class OrganizationmembersModule {}
