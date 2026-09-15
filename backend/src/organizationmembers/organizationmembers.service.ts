import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountStatus, RoleApp, RoleOrg, MemberStatus, OrganizationStatus } from '../../generated/prisma/client';


@Injectable()
export class OrganizationmembersService {
    constructor(private prisma: PrismaService) {}

// Find a specific member by username
    async findMemberByUsername(organizationId: bigint, username: string) {
    const membership = await this.prisma.organizationMember.findFirst({
        where: {
            organization_id: organizationId,
            status: MemberStatus.ACTIVE,

            user: {
            account_status: AccountStatus.ACTIVE,

            profile: {
                username: username,
            },
            },
        },

        include: {
        user: {
            select: {
            user_id: true,
            account_status: true,

            profile: {
                select: {
                username: true,
                description: true,
                profile_picture: true,
                },
            },
            },
        },
        },
        });

    if (!membership) {
        throw new NotFoundException('Active member not found in this organization');
    }

    return membership;
    }

// Get all the members of the organization - active members
    async findAllMembers(organizationId: bigint) {
    const organization = await this.prisma.organization.findUnique({
        where: {
        organization_id: organizationId,
        },
    });

    if (!organization) {
        throw new NotFoundException('Organization not found');
    }

    return this.prisma.organizationMember.findMany({
        where: {
        organization_id: organizationId,
        status: MemberStatus.ACTIVE,
        user: {
            account_status: AccountStatus.ACTIVE,
        },
        },
        include: {
        user: {
            select: {
            user_id: true,
            account_status: true,

            profile: {
                select: {
                username: true,
                description: true,
                profile_picture: true,
                },
            },
            },
        },
        },
    });
    }

// Get all the members of the organization - active, banned, pending, rejected
    async findAllMemberships(organizationId: bigint, requesterId: bigint) {
    const requester = await this.prisma.user.findUnique({
        where: {
        user_id: requesterId,
        },
    });

    if (!requester) {
        throw new NotFoundException('User not found');
    }

    if (requester.account_status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('User is not active');
    }

    if (requester.role !== RoleApp.ADMIN) {
        const membership = await this.prisma.organizationMember.findUnique({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: requesterId,
            },
        },
        });

        if (!membership) {
        throw new ForbiddenException('You are not a member of this organization');
        }

        if (membership.status !== MemberStatus.ACTIVE) {
        throw new ForbiddenException('Your membership is not active');
        }

        if (membership.role !== RoleOrg.MANAGER && membership.role !== RoleOrg.OWNER) {
        throw new ForbiddenException('You do not have permission to view memberships');
        }
    }

    return this.prisma.organizationMember.findMany({
        where: {
        organization_id: organizationId,
        },
        include: {
        user: {
            select: {
            user_id: true,
            account_status: true,

            profile: {
                select: {
                username: true,
                description: true,
                profile_picture: true,
                },
            },
            },
        },
        },
    });
}

// Get all the organization a user is a member of
    async findOrganizationsByUser(userId: bigint) {
    const user = await this.prisma.user.findUnique({
        where: {
        user_id: userId,
        },
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('User is not active');
    }

    return this.prisma.organizationMember.findMany({
        where: {
        user_id: userId,
        status: MemberStatus.ACTIVE,
        },
        include: {
        organization: true,
        },
    });
    }

// Helper prive pour eviter de repeter les controles :
    private async checkCanManageMembers(requesterId: bigint, organizationId: bigint) {
    const requester = await this.prisma.user.findUnique({
        where: {
        user_id: requesterId,
        },
    });

    if (!requester) {
        throw new NotFoundException('Requester not found');
    }

    if (requester.account_status !== AccountStatus.ACTIVE) {
        throw new ForbiddenException('Requester is not active');
    }

    const organization = await this.prisma.organization.findUnique({
        where: {
        organization_id: organizationId,
        },
    });

    if (!organization) {
        throw new NotFoundException('Organization not found');
    }

    if (
        organization.organization_status !== OrganizationStatus.ACTIVE
    ) {
        throw new BadRequestException('Organization is not active');
    }

    if (requester.role === RoleApp.ADMIN) {
        return;
    }

    const requesterMembership =
        await this.prisma.organizationMember.findUnique({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: requesterId,
            },
        },
        });

    if (!requesterMembership || requesterMembership.status !== MemberStatus.ACTIVE) {
        throw new ForbiddenException('Requester is not an active member of the organization');
    }

    if (requesterMembership.role !== RoleOrg.MANAGER && requesterMembership.role !== RoleOrg.OWNER
    ) {
        throw new ForbiddenException('You do not have permission to manage members');
    }
    }

// Add a user to an organization
    async addMember(requesterId: bigint, organizationId: bigint, targetUserId: bigint) {
    await this.checkCanManageMembers(
        requesterId,
        organizationId,
    );

    const targetUser = await this.prisma.user.findUnique({
        where: {
        user_id: targetUserId,
        },
    });

    if (!targetUser) {
        throw new NotFoundException('User not found');
    }

    if (targetUser.account_status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('User is not active');
    }

    const existingMembership =
        await this.prisma.organizationMember.findUnique({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: targetUserId,
            },
        },
        });

    if (existingMembership?.status === MemberStatus.PENDING) {
    throw new ConflictException('This user already has a pending membership request');
    }

    if (existingMembership?.status === MemberStatus.ACTIVE) {
    throw new ConflictException('This user is already a member of the organization');
    }

    if (existingMembership?.status === MemberStatus.REJECTED) {
     throw new ConflictException('A membership request for this user has already been rejected');
    }

    return this.prisma.organizationMember.create({
        data: {
        organization_id: organizationId,
        user_id: targetUserId,
        status: MemberStatus.ACTIVE,
        role: RoleOrg.MEMBER,
        validated_by_org_man: true,
        validated_at: new Date(),
        },
    });
    }

// Remove a user from an organization
    async removeMember(requesterId: bigint, organizationId: bigint, targetUserId: bigint) {
    await this.checkCanManageMembers(
        requesterId,
        organizationId,
    );

    if (requesterId === targetUserId) {
        throw new BadRequestException('Use leaveOrganization to leave the organization');
    }

    const targetMembership =
        await this.prisma.organizationMember.findUnique({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: targetUserId,
            },
        },
        include: {
        user: {
            select: {
            account_status: true,
            },
        },
        },
        });

    if (!targetMembership) {
        throw new NotFoundException('User is not a member of this organization');
    }

    if (targetMembership.status !== MemberStatus.ACTIVE) {
        throw new BadRequestException('Membership is not active');
    }

    if (
        targetMembership.user.account_status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Target user is not active');
    }

    if (targetMembership.role === RoleOrg.OWNER) {
        throw new ForbiddenException('The owner cannot be removed. Transfer ownership first.');
    }

    const requester = await this.prisma.user.findUnique({
        where: {
        user_id: requesterId,
        },
    });

    if (!requester) {
        throw new NotFoundException('Requester not found');
    }

    if (requester.role !== RoleApp.ADMIN) {
        const requesterMembership =
        await this.prisma.organizationMember.findUnique({
            where: {
            organization_id_user_id: {
                organization_id: organizationId,
                user_id: requesterId,
            },
            },
        });

        if (!requesterMembership) {
        throw new ForbiddenException('Requester is not a member of this organization');
        }

        if (requesterMembership.role === RoleOrg.MANAGER && targetMembership.role !== RoleOrg.MEMBER) {
        throw new ForbiddenException('A manager can only remove members');
        }
    }

    return this.prisma.organizationMember.delete({
        where: {
        organization_id_user_id: {
            organization_id: organizationId,
            user_id: targetUserId,
        },
        },
    });
    }

// Ban a user from an organization
    async banMember(requesterId: bigint, organizationId: bigint, targetUserId: bigint) {
    await this.checkCanManageMembers(
        requesterId,
        organizationId,
    );

    if (requesterId === targetUserId) {
        throw new BadRequestException('You cannot ban yourself');
    }

    const targetMembership = await this.prisma.organizationMember.findUnique({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: targetUserId,
            },
        },
        include: {
        user: {
            select: {
            account_status: true,
            },
        },
        },
        });

    if (!targetMembership) {
        throw new NotFoundException('User is not a member of this organization');
    }

    if (targetMembership.status === MemberStatus.BANNED) {
        throw new ConflictException('User is already banned from this organization');
    }

    if (targetMembership.status !== MemberStatus.ACTIVE) {
        throw new BadRequestException('Only an active member can be banned');
    }

    if (targetMembership.user.account_status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Target user is not active');
    }

    if (targetMembership.role === RoleOrg.OWNER) {
        throw new ForbiddenException('The owner cannot be banned. Transfer ownership first.');
    }

    const requester = await this.prisma.user.findUnique({
        where: {
        user_id: requesterId,
        },
    });

    if (!requester) {
        throw new NotFoundException('Requester not found');
    }

    if (requester.role !== RoleApp.ADMIN) {
        const requesterMembership = await this.prisma.organizationMember.findUnique({
            where: {
            organization_id_user_id: {
                organization_id: organizationId,
                user_id: requesterId,
            },
            },
        });

        if (!requesterMembership) {
        throw new ForbiddenException('Requester is not a member of this organization');
        }

        if (requesterMembership.role === RoleOrg.MANAGER && targetMembership.role !== RoleOrg.MEMBER) {
        throw new ForbiddenException('A manager can only ban members');
        }
    }

    return this.prisma.organizationMember.update({
        where: {
        organization_id_user_id: {
            organization_id: organizationId,
            user_id: targetUserId,
        },
        },
        data: {
        status: MemberStatus.BANNED,
        },
    });
    }

// Join an organization
    async joinOrganization(userId: bigint, organizationId: bigint) {
    const user = await this.prisma.user.findUnique({
        where: {
        user_id: userId,
        },
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.ACTIVE) {
        throw new ForbiddenException('Only active users can join an organization');
    }

    const organization = await this.prisma.organization.findUnique({
        where: {
            organization_id: organizationId,
        },
        });

    if (!organization) {
        throw new NotFoundException('Organization not found');
    }

    if (organization.organization_status !== OrganizationStatus.ACTIVE) {
        throw new BadRequestException('Organization is not active');
    }

    const existingMembership = await this.prisma.organizationMember.findUnique({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: userId,
            },
        },
        });

    if (existingMembership?.status === MemberStatus.BANNED) {
        throw new ForbiddenException('You are banned from this organization');
    }

    if (existingMembership?.status === MemberStatus.PENDING) {
        throw new ConflictException('A membership request is already pending');
    }

    if (existingMembership?.status === MemberStatus.ACTIVE) {
        throw new ConflictException('You are already a member of this organization');
    }

    if (existingMembership?.status === MemberStatus.REJECTED) {
        throw new ConflictException('A previous membership request has already been rejected');
    }

    return this.prisma.organizationMember.create({
        data: {
        organization_id: organizationId,
        user_id: userId,
        role: RoleOrg.MEMBER,
        status: MemberStatus.PENDING,
        validated_by_org_man: false,
        validated_at: null,
        },
    });
    }

// Approve a membership request
    async approveMembership(requesterId: bigint, organizationId: bigint, targetUserId: bigint) {
    await this.checkCanManageMembers(
        requesterId,
        organizationId,
    );

    const membership = await this.prisma.organizationMember.findUnique({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: targetUserId,
            },
        },
        include: {
        user: {
            select: {
            account_status: true,
            },
        },
        },
        });

    if (!membership) {
        throw new NotFoundException('Membership request not found');
    }

    if (membership.status !== MemberStatus.PENDING) {
        throw new BadRequestException('Membership request is not pending');
    }

    if (membership.user.account_status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Target user is not active');
    }

    return this.prisma.organizationMember.update({
        where: {
        organization_id_user_id: {
            organization_id: organizationId,
            user_id: targetUserId,
        },
        },
        data: {
        status: MemberStatus.ACTIVE,
        role: RoleOrg.MEMBER,
        validated_by_org_man: true,
        validated_at: new Date(),
        },
    });
    }

// Deny a membership request
    async denyMembership(requesterId: bigint, organizationId: bigint, targetUserId: bigint) {
    await this.checkCanManageMembers(
        requesterId,
        organizationId,
    );

    const membership = await this.prisma.organizationMember.findUnique({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: targetUserId,
            },
        },
        });

    if (!membership) {
        throw new NotFoundException('Membership request not found');
    }

    if (membership.status !== MemberStatus.PENDING) {
        throw new BadRequestException('Membership request is not pending');
    }

    return this.prisma.organizationMember.update({
        where: {
        organization_id_user_id: {
            organization_id: organizationId,
            user_id: targetUserId,
        },
        },
        data: {
        status: MemberStatus.REJECTED,
        validated_by_org_man: false,
        validated_at: new Date(),
        },
    });
    }

// Leave an organization
    async leaveOrganization(userId: bigint, organizationId: bigint) {
    const user = await this.prisma.user.findUnique({
        where: {
        user_id: userId,
        },
    });

    if (!user) {
        throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.ACTIVE) {
        throw new ForbiddenException('Only active users can leave an organization');
    }

    const organization = await this.prisma.organization.findUnique({
        where: {
            organization_id: organizationId,
        },
        });

    if (!organization) {
        throw new NotFoundException('Organization not found');
    }

    if (organization.organization_status !== OrganizationStatus.ACTIVE) {
        throw new BadRequestException('Organization is not active');
    }

    const membership = await this.prisma.organizationMember.findUnique({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: userId,
            },
        },
        });

    if (!membership) {
        throw new NotFoundException('You are not a member of this organization');
    }

    if (membership.status !== MemberStatus.ACTIVE) {
        throw new BadRequestException('Membership is not active');
    }

    if (membership.role === RoleOrg.OWNER) {
        throw new ForbiddenException('The owner must transfer ownership before leaving the organization');
    }

    return this.prisma.organizationMember.delete({
        where: {
        organization_id_user_id: {
            organization_id: organizationId,
            user_id: userId,
        },
        },
    });
    }

// Helper pour checker que c'est le owner ou l'admin
    private async checkCanManageRoles(requesterId: bigint, organizationId: bigint) {
    const requester = await this.prisma.user.findUnique({
        where: {
        user_id: requesterId,
        },
    });

    if (!requester) {
        throw new NotFoundException('Requester not found');
    }

    if (requester.account_status !== AccountStatus.ACTIVE) {
        throw new ForbiddenException('Requester is not active');
    }

    const organization = await this.prisma.organization.findUnique({
        where: {
        organization_id: organizationId,
        },
    });

    if (!organization) {
        throw new NotFoundException('Organization not found');
    }

    if (organization.organization_status !==  OrganizationStatus.ACTIVE) {
        throw new BadRequestException('Organization is not active');
    }

    if (requester.role === RoleApp.ADMIN) {
        return;
    }

    const requesterMembership = await this.prisma.organizationMember.findUnique({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: requesterId,
            },
        },
        });

    if (!requesterMembership || requesterMembership.status !== MemberStatus.ACTIVE) {
        throw new ForbiddenException('Requester is not an active member of the organization');
    }

    if (requesterMembership.role !== RoleOrg.OWNER) {
        throw new ForbiddenException('Only the owner can manage organization roles');
    }
    }

// Promote a member to manager
    async promoteToManager(requesterId: bigint, organizationId: bigint, targetUserId: bigint) {
    await this.checkCanManageRoles(
        requesterId,
        organizationId,
    );

    const membership = await this.prisma.organizationMember.findUnique({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: targetUserId,
            },
        },
        include: {
        user: {
            select: {
            account_status: true,
            },
        },
        },
        });

    if (!membership) {
        throw new NotFoundException('User is not a member of this organization');
    }

    if (membership.status !== MemberStatus.ACTIVE) {
        throw new BadRequestException('Membership is not active');
    }

    if (membership.user.account_status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Target user is not active');
    }

    if (membership.role !== RoleOrg.MEMBER) {
        throw new BadRequestException('Only a member can be promoted to manager');
    }

    return this.prisma.organizationMember.update({
        where: {
        organization_id_user_id: {
            organization_id: organizationId,
            user_id: targetUserId,
        },
        },
        data: {
        role: RoleOrg.MANAGER,
        },
    });
    }

// Demote a manager to member
    async demoteToMember(requesterId: bigint, organizationId: bigint, targetUserId: bigint) {
    await this.checkCanManageRoles(
        requesterId,
        organizationId,
    );

    const membership = await this.prisma.organizationMember.findUnique({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: targetUserId,
            },
        },
        include: {
        user: {
            select: {
            account_status: true,
            },
        },
        },
        });

    if (!membership) {
        throw new NotFoundException('User is not a member of this organization');
    }

    if (membership.status !== MemberStatus.ACTIVE) {
        throw new BadRequestException('Membership is not active');
    }

    if (membership.user.account_status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Target user is not active');
    }

    if (membership.role !== RoleOrg.MANAGER) {
        throw new BadRequestException('Only a manager can be demoted to member');
    }

    return this.prisma.organizationMember.update({
        where: {
        organization_id_user_id: {
            organization_id: organizationId,
            user_id: targetUserId,
        },
        },
        data: {
        role: RoleOrg.MEMBER,
        },
    });
    }

// Transfer ownership
    async transferOwnership(requesterId: bigint, organizationId: bigint, newOwnerId: bigint) {
    await this.checkCanManageRoles(
        requesterId,
        organizationId,
    );

    const newOwnerMembership = await this.prisma.organizationMember.findUnique({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: newOwnerId,
            },
        },
        include: {
        user: {
            select: {
            account_status: true,
            },
        },
        },
        });

    if (!newOwnerMembership) {
        throw new NotFoundException('New owner is not a member of this organization');
    }

    if (newOwnerMembership.status !== MemberStatus.ACTIVE) {
        throw new BadRequestException('New owner membership is not active');
    }

    if (newOwnerMembership.user.account_status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('New owner is not active');
    }

    if (newOwnerMembership.role === RoleOrg.OWNER) {
        throw new ConflictException('This user is already the owner');
    }

    const currentOwner = await this.prisma.organizationMember.findFirst({
        where: {
            organization_id: organizationId,
            role: RoleOrg.OWNER,
            status: MemberStatus.ACTIVE,
        },
        });

    if (!currentOwner) {
        throw new NotFoundException('Current organization owner not found');
    }

    return this.prisma.$transaction([
        this.prisma.organizationMember.update({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: currentOwner.user_id,
            },
        },
        data: {
            role: RoleOrg.MANAGER,
        },
        }),

        this.prisma.organizationMember.update({
        where: {
            organization_id_user_id: {
            organization_id: organizationId,
            user_id: newOwnerId,
            },
        },
        data: {
            role: RoleOrg.OWNER,
        },
        }),
    ]);
    }
}
