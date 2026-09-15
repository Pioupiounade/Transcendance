import { Controller, Get, Post, Patch, Delete, Param, BadRequestException } from '@nestjs/common';
import { OrganizationmembersService } from './organizationmembers.service';

@Controller('organization-members')
export class OrganizationmembersController {
  constructor(private readonly organizationMembersService: OrganizationmembersService) {}

  private toBigInt(value: string, fieldName: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException(`${fieldName} must be a valid integer`);
    }
  }

  @Get('organization/:organizationId/member/:username')
  findMemberByUsername(
    @Param('organizationId') organizationId: string,
    @Param('username') username: string,
  ) {
    return this.organizationMembersService.findMemberByUsername(
      this.toBigInt(organizationId, 'organizationId'),
      username,
    );
  }
  @Get('organization/:organizationId/members')
  findAllMembers(
    @Param('organizationId') organizationId: string,
  ) {
    return this.organizationMembersService.findAllMembers(
      this.toBigInt(organizationId, 'organizationId'),
    );
  }

  @Get('organization/:organizationId/memberships/:requesterId')
  findAllMemberships(
    @Param('organizationId') organizationId: string,
    @Param('requesterId') requesterId: string,
  ) {
    return this.organizationMembersService.findAllMemberships(
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(requesterId, 'requesterId'),
    );
  }

  @Get('user/:userId/organizations')
  findOrganizationsByUser(@Param('userId') userId: string) {
    return this.organizationMembersService.findOrganizationsByUser(
      this.toBigInt(userId, 'userId'),
    );
  }

  @Post('organization/:organizationId/member/:targetUserId/add/:requesterId')
  addMember(
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
    @Param('requesterId') requesterId: string,
  ) {
    return this.organizationMembersService.addMember(
      this.toBigInt(requesterId, 'requesterId'),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @Delete('organization/:organizationId/member/:targetUserId/remove/:requesterId')
  removeMember(
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
    @Param('requesterId') requesterId: string,
  ) {
    return this.organizationMembersService.removeMember(
      this.toBigInt(requesterId, 'requesterId'),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @Patch('organization/:organizationId/member/:targetUserId/ban/:requesterId')
  banMember(
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
    @Param('requesterId') requesterId: string,
  ) {
    return this.organizationMembersService.banMember(
      this.toBigInt(requesterId, 'requesterId'),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @Post('organization/:organizationId/join/:userId')
  joinOrganization(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
  ) {
    return this.organizationMembersService.joinOrganization(
      this.toBigInt(userId, 'userId'),
      this.toBigInt(organizationId, 'organizationId'),
    );
  }

  @Patch('organization/:organizationId/member/:targetUserId/approve/:requesterId')
  approveMembership(
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
    @Param('requesterId') requesterId: string,
  ) {
    return this.organizationMembersService.approveMembership(
      this.toBigInt(requesterId, 'requesterId'),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @Patch('organization/:organizationId/member/:targetUserId/deny/:requesterId')
  denyMembership(
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
    @Param('requesterId') requesterId: string,
  ) {
    return this.organizationMembersService.denyMembership(
      this.toBigInt(requesterId, 'requesterId'),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @Delete('organization/:organizationId/leave/:userId')
  leaveOrganization(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
  ) {
    return this.organizationMembersService.leaveOrganization(
      this.toBigInt(userId, 'userId'),
      this.toBigInt(organizationId, 'organizationId'),
    );
  }

  @Patch('organization/:organizationId/member/:targetUserId/promote/:requesterId')
  promoteToManager(
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
    @Param('requesterId') requesterId: string,
  ) {
    return this.organizationMembersService.promoteToManager(
      this.toBigInt(requesterId, 'requesterId'),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @Patch('organization/:organizationId/member/:targetUserId/demote/:requesterId')
  demoteToMember(
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
    @Param('requesterId') requesterId: string,
  ) {
    return this.organizationMembersService.demoteToMember(
      this.toBigInt(requesterId, 'requesterId'),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @Patch('organization/:organizationId/transfer-ownership/:newOwnerId/:requesterId')
  transferOwnership(
    @Param('organizationId') organizationId: string,
    @Param('newOwnerId') newOwnerId: string,
    @Param('requesterId') requesterId: string,
  ) {
    return this.organizationMembersService.transferOwnership(
      this.toBigInt(requesterId, 'requesterId'),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(newOwnerId, 'newOwnerId'),
    );
  }
}