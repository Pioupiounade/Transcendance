import { Controller, Get, Post, Patch, Delete, Param, BadRequestException, Req, UseGuards } from '@nestjs/common';
import { OrganizationmembersService } from './organizationmembers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

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

  @UseGuards(JwtAuthGuard)
  @Get('organization/:organizationId/me')
  findMyMembership(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
  ) {
    return this.organizationMembersService.findMyMembership(
      this.toBigInt(organizationId, 'organizationId'),
      BigInt(req.user.id),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('organization/:organizationId/memberships')
  findAllMemberships(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
  ) {
    return this.organizationMembersService.findAllMemberships(
      this.toBigInt(organizationId, 'organizationId'),
      BigInt(req.user.id),
    );
  }

  @Get('user/:userId/organizations')
  findOrganizationsByUser(@Param('userId') userId: string) {
    return this.organizationMembersService.findOrganizationsByUser(
      this.toBigInt(userId, 'userId'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('organization/:organizationId/member/:targetUserId/add')
  addMember(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.organizationMembersService.addMember(
      BigInt(req.user.id),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('organization/:organizationId/member/:targetUserId/remove')
  removeMember(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.organizationMembersService.removeMember(
      BigInt(req.user.id),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('organization/:organizationId/member/:targetUserId/ban')
  banMember(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.organizationMembersService.banMember(
      BigInt(req.user.id),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('organization/:organizationId/join')
  joinOrganization(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
  ) {
    return this.organizationMembersService.joinOrganization(
      BigInt(req.user.id),
      this.toBigInt(organizationId, 'organizationId'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('organization/:organizationId/member/:targetUserId/approve')
  approveMembership(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.organizationMembersService.approveMembership(
      BigInt(req.user.id),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('organization/:organizationId/member/:targetUserId/reactivate')
  reactivateMembership(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.organizationMembersService.reactivateMembership(
      BigInt(req.user.id),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('organization/:organizationId/member/:targetUserId/deny')
  denyMembership(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.organizationMembersService.denyMembership(
      BigInt(req.user.id),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('organization/:organizationId/leave')
  leaveOrganization(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
  ) {
    return this.organizationMembersService.leaveOrganization(
      BigInt(req.user.id),
      this.toBigInt(organizationId, 'organizationId'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('organization/:organizationId/member/:targetUserId/promote')
  promoteToManager(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.organizationMembersService.promoteToManager(
      BigInt(req.user.id),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('organization/:organizationId/member/:targetUserId/demote')
  demoteToMember(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.organizationMembersService.demoteToMember(
      BigInt(req.user.id),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(targetUserId, 'targetUserId'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('organization/:organizationId/transfer-ownership/:newOwnerId')
  transferOwnership(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
    @Param('newOwnerId') newOwnerId: string,
  ) {
    return this.organizationMembersService.transferOwnership(
      BigInt(req.user.id),
      this.toBigInt(organizationId, 'organizationId'),
      this.toBigInt(newOwnerId, 'newOwnerId'),
    );
  }
}