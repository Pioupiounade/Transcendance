import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountStatus, ActionStatus, MemberStatus, OrganizationStatus, PointReason, RoleApp, RoleOrg } from '../../generated/prisma/client';


@Injectable()
export class PointtransactionService {

  constructor(private prisma: PrismaService) {}

  private async checkUserCanReceiveReward(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: {
        user_id: userId,
      },
      select: {
        user_id: true,
        account_status: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Only active users can receive points');
    }

    return user;
  }

  private async checkOrganizationIsActive(organizationId: bigint) {

    const organization = await this.prisma.organization.findUnique({
      where: {
        organization_id: organizationId,
      },
      select: {
        organization_id: true,
        organization_status: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.organization_status !== OrganizationStatus.ACTIVE) {
      throw new BadRequestException('Organization is not active');
    }

    return organization;
  }

  private async findOrganizationOwner(organizationId: bigint) {

    const ownerMembership = await this.prisma.organizationMember.findFirst({
        where: {
          organization_id: organizationId,
          status: MemberStatus.ACTIVE,
          role: RoleOrg.OWNER,
        },

        select: {
          user_id: true,
        },
      });

    if (!ownerMembership) {
      throw new NotFoundException('Organization owner not found');
    }

    return ownerMembership.user_id;
  }

  private async checkCanViewPoints(requesterId: bigint, targetUserId: bigint) {

    const requester = await this.prisma.user.findUnique({
      where: {
        user_id: requesterId,
      },

      select: {
        user_id: true,
        role: true,
      },
    });

    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    const isOwnAccount = requesterId === targetUserId;

    const isAdmin = requester.role === RoleApp.ADMIN;

    if (!isOwnAccount && !isAdmin) {
      throw new ForbiddenException('You can only view your own points');
    }
  }

  private async createPointTransaction(userId: bigint, points: number, reason: PointReason, eventKey: string) {

    if (points === 0) {
      throw new BadRequestException('Point transaction cannot be zero');
    }

    const existingTransaction = await this.prisma.pointTransaction.findUnique({
        where: {
          event_key: eventKey,
        },
      });

    if (existingTransaction) {
      throw new ConflictException('This point transaction has already been processed');
    }

    try {

      return await this.prisma.$transaction(async (tx) => {
        const pointTransaction =  await tx.pointTransaction.create({
            data: {
              user_id: userId,
              points,
              reason,
              event_key: eventKey,
            },
          });

        await tx.user.update({
          where: {
            user_id: userId,
          },

          data: {
            points: {
              increment: points,
            },
          },
        });

        return pointTransaction;
      });

    }

    catch (error) {

        const prismaError = error as {
        code?: string;
      };


      if (prismaError.code === 'P2002') {
        throw new ConflictException('This point transaction has already been processed');
      }

      throw error;
    }
  }

  async rewardActionCompleted(actionId: bigint) {

    const action = await this.prisma.action.findUnique({
      where: {
        action_id: actionId,
      },

      select: {
        action_id: true,
        creator_id: true,
        organization_id: true,
        status: true,
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (action.status !== ActionStatus.COMPLETED) {
      throw new BadRequestException('Only a completed action can give points');
    }

    await this.checkUserCanReceiveReward(
      action.creator_id,
    );

    if (action.organization_id) {
      await this.checkOrganizationIsActive(
        action.organization_id,
      );
    }

    return this.createPointTransaction(
      action.creator_id,
      20,
      PointReason.ACTION_COMPLETED,
      `ACTION_COMPLETED:${actionId}:${action.creator_id}`,
    );
  }

  async rewardParticipation(actionId: bigint, participantId: bigint) {

    await this.checkUserCanReceiveReward(
      participantId,
    );

    const action = await this.prisma.action.findUnique({
      where: {
        action_id: actionId,
      },

      select: {
        action_id: true,
        status: true,
        organization_id: true,
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (action.status !== ActionStatus.COMPLETED) {
      throw new BadRequestException('Points are only awarded for a completed action');
    }

    if (action.organization_id) {
      await this.checkOrganizationIsActive(
        action.organization_id,
      );
    }

    const participation = await this.prisma.participation.findUnique({
        where: {
          action_id_user_id: {
            action_id: actionId,
            user_id: participantId,
          },
        },
      });

    if (!participation) {
      throw new BadRequestException('User did not participate in this action');
    }

    return this.createPointTransaction(
      participantId,
      10,
      PointReason.ACTION_PARTICIPATED,
      `ACTION_PARTICIPATED:${actionId}:${participantId}`,
    );
  }

  async rewardCreatorForParticipant(actionId: bigint, participantId: bigint) {

    const action = await this.prisma.action.findUnique({
      where: {
        action_id: actionId,
      },

      select: {
        action_id: true,
        creator_id: true,
        organization_id: true,
        status: true,
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (action.status !== ActionStatus.COMPLETED) {
      throw new BadRequestException('The action must be completed');
    }

    await this.checkUserCanReceiveReward(
      action.creator_id,
    );

    if (action.organization_id) {
      await this.checkOrganizationIsActive(
        action.organization_id,
      );
    }

    const participation = await this.prisma.participation.findUnique({
        where: {
          action_id_user_id: {
            action_id: actionId,
            user_id: participantId,
          },
        },
      });

    if (!participation) {
      throw new BadRequestException('Participant not found for this action');
    }

    return this.createPointTransaction(
      action.creator_id,
      5,
      PointReason.ACTION_PARTICIPANTS,
      `ACTION_PARTICIPANTS:${actionId}:${participantId}`,
    );
  }

  async rewardOwnerForNewMember(organizationId: bigint, memberId: bigint) {
    await this.checkOrganizationIsActive(
      organizationId,
    );

    const membership = await this.prisma.organizationMember.findUnique({
        where: {
          organization_id_user_id: {
            organization_id: organizationId,
            user_id: memberId,
          },
        },

        select: {
          user_id: true,
          status: true,
          role: true,
          created_at: true,
        },
      });

    if (!membership) {
      throw new NotFoundException('Organization membership not found');
    }


    if (membership.status !== MemberStatus.ACTIVE) {
      throw new BadRequestException('Only an active membership can reward the owner');
    }

    const ownerId = await this.findOrganizationOwner(
        organizationId,
      );

    if (ownerId === memberId) {
      throw new BadRequestException('The owner cannot receive points for joining their own organization');
    }

    await this.checkUserCanReceiveReward(
      ownerId,
    );


    return this.createPointTransaction(
      ownerId,
      5,
      PointReason.ORGANIZATION_MEMBER_JOINED,
      `ORGANIZATION_MEMBER_JOINED:${organizationId}:${memberId}:${membership.created_at.toISOString()}`,
    );
  }

  private async penalizeOwnerForMemberDeparture(organizationId: bigint, memberId: bigint, membershipCreatedAt: 
    Date, reason: PointReason) {

    const ownerId = await this.findOrganizationOwner(
        organizationId,
      );

    let reasonName: string;

    switch (reason) {

      case PointReason.ORGANIZATION_MEMBER_LEFT:
        reasonName = 'ORGANIZATION_MEMBER_LEFT';
        break;

      case PointReason.ORGANIZATION_MEMBER_REMOVED:
        reasonName = 'ORGANIZATION_MEMBER_REMOVED';
        break;

      case PointReason.ORGANIZATION_MEMBER_BANNED:
        reasonName = 'ORGANIZATION_MEMBER_BANNED';
        break;

      default:
        throw new BadRequestException('Invalid organization departure reason');
    }

    return this.createPointTransaction(
      ownerId,
      -5,
      reason,
      `${reasonName}:${organizationId}:${memberId}:${membershipCreatedAt.toISOString()}`,
    );
  }

  async penalizeOwnerForMemberLeaving(organizationId: bigint, memberId: bigint, membershipCreatedAt: Date) {

    return this.penalizeOwnerForMemberDeparture(
      organizationId,
      memberId,
      membershipCreatedAt,
      PointReason.ORGANIZATION_MEMBER_LEFT,
    );
  }

  async penalizeOwnerForMemberRemoval(organizationId: bigint, memberId: bigint, membershipCreatedAt: Date) {

    return this.penalizeOwnerForMemberDeparture(
      organizationId,
      memberId,
      membershipCreatedAt,
      PointReason.ORGANIZATION_MEMBER_REMOVED,
    );
  }

  async penalizeOwnerForMemberBan(organizationId: bigint, memberId: bigint, membershipCreatedAt: Date) {

    return this.penalizeOwnerForMemberDeparture(
      organizationId,
      memberId,
      membershipCreatedAt,
      PointReason.ORGANIZATION_MEMBER_BANNED,
    );
  }

  async penalizeSuspendedUser(userId: bigint) {

    const user = await this.prisma.user.findUnique({
      where: {
        user_id: userId,
      },

      select: {
        user_id: true,
        account_status: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      user.account_status !==
      AccountStatus.SUSPENDED
    ) {
      throw new BadRequestException('User is not suspended');
    }

    return this.createPointTransaction(
      userId,
      -50,
      PointReason.USER_SUSPENDED,
      `USER_SUSPENDED:${userId}:${user.updated_at.toISOString()}`,
    );
  }

  async penalizeBannedUser(organizationId: bigint, userId: bigint, membershipCreatedAt: Date) {

    const user = await this.prisma.user.findUnique({
      where: {
        user_id: userId,
      },

      select: {
        user_id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const membership = await this.prisma.organizationMember.findUnique({
        where: {
          organization_id_user_id: {
            organization_id: organizationId,
            user_id: userId,
          },
        },

        select: {
          status: true,
        },
      });

    if (!membership) {
      throw new NotFoundException('Organization membership not found');
    }

    if (membership.status !== MemberStatus.BANNED) {
      throw new BadRequestException('User is not banned from this organization');
    }

    return this.createPointTransaction(
      userId,
      -15,
      PointReason.USER_BANNED_FROM_ORGANIZATION,
      `USER_BANNED_FROM_ORGANIZATION:${organizationId}:${userId}:${membershipCreatedAt.toISOString()}`,
    );
  }

  async adminAddPoints(adminId: bigint, targetUserId: bigint, points: number, adjustmentKey: string) {

    const admin = await this.prisma.user.findUnique({
      where: {
        user_id: adminId,
      },

      select: {
        user_id: true,
        role: true,
        account_status: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (admin.role !== RoleApp.ADMIN) {
      throw new ForbiddenException('Only an admin can manually add points');
    }

    if (admin.account_status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException('Admin account is not active');
    }

    if (points <= 0) {
      throw new BadRequestException('Points must be greater than zero');
    }

    await this.checkUserCanReceiveReward(
      targetUserId,
    );

    if (!adjustmentKey.trim()) {
      throw new BadRequestException('Adjustment key is required');
    }

    return this.createPointTransaction(
      targetUserId,
      points,
      PointReason.ADMIN_ADJUSTMENT,
      `ADMIN_ADJUSTMENT:${adminId}:${targetUserId}:${adjustmentKey}`,
    );
  }

  async getUserPoints(requesterId: bigint, targetUserId: bigint) {

    await this.checkCanViewPoints(
      requesterId,
      targetUserId,
    );

    const user = await this.prisma.user.findUnique({
      where: {
        user_id: targetUserId,
      },

      select: {
        user_id: true,
        points: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getUserPointTransactions(requesterId: bigint, targetUserId: bigint) {

    await this.checkCanViewPoints(
      requesterId,
      targetUserId,
    );

    const user = await this.prisma.user.findUnique({
      where: {
        user_id: targetUserId,
      },

      select: {
        user_id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.pointTransaction.findMany({
      where: {
        user_id: targetUserId,
      },

      orderBy: {
        created_at: 'desc',
      },
    });
  }
}