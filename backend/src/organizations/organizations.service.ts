import { Injectable, NotFoundException, BadRequestException, ForbiddenException, HttpException, HttpStatus, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AccountStatus, RoleApp, RoleOrg, MemberStatus, OrganizationStatus, Prisma, NotificationType, ActionStatus } from '../../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class OrganizationsService {

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private realtimeGateway: RealtimeGateway,
  ) { }

  //1. recuperer toutes les organisations
  async findAll() {
    const organizations = await this.prisma.organization.findMany();

    return organizations.map((organization) => ({
      ...organization,
      organization_id: organization.organization_id.toString(),
      creator_id: organization.creator_id?.toString() ?? null,
    }));
  }

  //2. recupere une organisation grace a son id
  async findOne(id: string) {
    if (!/^\d+$/.test(id)) {
      return null;
    }

    const organization = await this.prisma.organization.findUnique({
      where: {
        organization_id: BigInt(id),
      },
    });

    if (!organization) {
      return null;
    }

    return {
      ...organization,
      organization_id: organization.organization_id.toString(),
      creator_id: organization.creator_id?.toString() ?? null,
    };
  }

  //3. organizations par creator_id
  async findByCreator(id: string) {
    const organizations = await this.prisma.organization.findMany({
      where: {
        creator_id: BigInt(id),
      },
    });

    if (organizations.length === 0) {
      throw new NotFoundException('No organizations created by this user');
    }

    return organizations.map((organization) => ({
      ...organization,
      organization_id: organization.organization_id.toString(),
      creator_id: organization.creator_id?.toString() ?? null,
    }));
  }

  //4. organizations par zone
  async findByRadius(lat: number, lng: number, radiusKm: number) {
    const organizations = await this.prisma.organization.findMany();

    const nearbyOrganizations = organizations.filter((organization) => {
      const [orgLat, orgLng] = organization.location;

      const distance = this.calculateDistance(
        lat,
        lng,
        orgLat,
        orgLng,
      );

      return distance <= radiusKm;
    });

    return nearbyOrganizations.map((organization) => ({
      ...organization,
      organization_id: organization.organization_id.toString(),
      creator_id: organization.creator_id?.toString() ?? null,
    }));
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const earthRadiusKm = 6371;

    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRadians(lat1)) *
      Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  //5. organizations par nom - autofill
  async searchByName(query: string) {
    const organizations = await this.prisma.organization.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 15,
    });

    return organizations.map((organization) => ({
      ...organization,
      organization_id: organization.organization_id.toString(),
      creator_id: organization.creator_id?.toString() ?? null,
    }));
  }

  //6. creer une nouvelle organisation
  async create(currentUserId: string, data: CreateOrganizationDto) {
    const creator = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    if (creator.account_status !== AccountStatus.ACTIVE) {
      throw new BadRequestException(
        'Only an active user can create an organization',
      );
    }
    const createdOrganization = await this.prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        title: data.title,
        description: data.description,
        address: data.address,
        location: data.location,
        creator_id: BigInt(currentUserId),
      },
    });

    await tx.organizationMember.create({
      data: {
        organization_id: organization.organization_id,
        user_id: BigInt(currentUserId),
        status: MemberStatus.ACTIVE,
        role: RoleOrg.OWNER,
        validated_by_org_man: true,
        validated_at: new Date(),
      },
    });

    return organization;
  });

    await this.realtimeGateway.emitAdminDirectoryChanged(
      'organizations',
    );
    
    return {
      ...createdOrganization,
      organization_id: createdOrganization.organization_id.toString(),
      creator_id: createdOrganization.creator_id?.toString() ?? null,
    };
  }

  //7. mettre a jour les donnees de l'organisation
  async update(id: string, data: UpdateOrganizationDto, currentUserId: string,) {
    const organization = await this.prisma.organization.findUnique({
      where: {
        organization_id: BigInt(id),
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organization_id_user_id: {
          organization_id: BigInt(id),
          user_id: BigInt(currentUserId),
        },
      },
    });

    const isAdmin = currentUser.role === RoleApp.ADMIN;

    const isCreator = organization.creator_id === BigInt(currentUserId);

    const isManagerOrOwner = membership?.status === MemberStatus.ACTIVE &&
      (
        membership.role === RoleOrg.MANAGER ||
        membership.role === RoleOrg.OWNER
      );

    if (!isAdmin && !isCreator && !isManagerOrOwner) {
      throw new ForbiddenException(
        'You are not allowed to update this organization',
      );
    }

    const updatedOrganization = await this.prisma.organization.update({
      where: {
        organization_id: BigInt(id),
      },
      data: {
        title: data.title,
        description: data.description,
        address: data.address,
        location: data.location,
      },
    });

    return {
      ...updatedOrganization,
      organization_id: updatedOrganization.organization_id.toString(),
      creator_id: updatedOrganization.creator_id?.toString() ?? null,
    };
  }

  //8. susprendre une organisation
  async suspend(id: string, currentUserId: string,) {
    const organization = await this.prisma.organization.findUnique({
      where: {
        organization_id: BigInt(id),
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    if (currentUser.role !== RoleApp.ADMIN) {
      throw new ForbiddenException('Only an admin can suspend an organization');
    }

    if (organization.organization_status !== OrganizationStatus.ACTIVE) {
      throw new BadRequestException('Only an active organization can be suspended');
    }

    const updatedOrganization = await this.prisma.organization.update({
      where: {
        organization_id: BigInt(id),
      },
      data: {
        organization_status: OrganizationStatus.SUSPENDED,
      },
    });

    this.realtimeGateway.emitOrganizationUpdated(id);

    return {
      ...updatedOrganization,
      organization_id: updatedOrganization.organization_id.toString(),
      creator_id: updatedOrganization.creator_id?.toString() ?? null,
    };
  }

  //9. desactiver une organisation
  async deactivate(id: string, currentUserId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: {
        organization_id: BigInt(id),
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organization_id_user_id: {
          organization_id: BigInt(id),
          user_id: BigInt(currentUserId),
        },
      },
    });

    const isAdmin = currentUser.role === RoleApp.ADMIN;

    const isCreator = organization.creator_id === BigInt(currentUserId);

    const isManagerOrOwner = membership?.status === MemberStatus.ACTIVE &&
      (
        membership.role === RoleOrg.MANAGER ||
        membership.role === RoleOrg.OWNER
      );

    if (organization.organization_status === OrganizationStatus.ACTIVE) {
      if (!isAdmin && !isCreator && !isManagerOrOwner) {
        throw new ForbiddenException(
          'You are not allowed to close this organization',
        );
      }
    }

    else {
      throw new BadRequestException(
        'Organization is not active',
      );
    }

    const {
      updatedOrganization,
      cancelledActions,
    } = await this.prisma.$transaction(async (tx) => {
      const cancelledActions = await tx.action.findMany({
        where: {
          organization_id: BigInt(id),
          status: {
            in: [ActionStatus.PENDING, ActionStatus.APPROVED],
          },
        },
        select: {
          action_id: true,
          title: true,
          creator_id: true,
          participation: {
            select: {
              user_id: true,
            },
          },
        },
      });

      await tx.action.updateMany({
        where: {
          organization_id: BigInt(id),
          status: {
            in: [ActionStatus.PENDING, ActionStatus.APPROVED],
          },
        },
        data: {
          status: ActionStatus.CANCELLED,
        },
      });

      const updatedOrganization = await tx.organization.update({
        where: {
          organization_id: BigInt(id),
        },
        data: {
          organization_status: OrganizationStatus.CLOSED,
        },
      });

      return {
        updatedOrganization,
        cancelledActions,
      };
    });

    this.realtimeGateway.emitOrganizationUpdated(id);

    for (const action of cancelledActions) {
      this.realtimeGateway.emitActionUpdated(
        action.action_id.toString(),
      );

      const recipientIds = new Set(
        action.participation.map(
          (participant) => participant.user_id,
        ),
      );

      if (action.creator_id !== null) {
        recipientIds.add(action.creator_id);
      }

      for (const recipientId of recipientIds) {
        await this.notificationsService.notifyUser({
          userId: recipientId,
          type: NotificationType.ACTION_STATUS_CHANGED,
          title: 'Action cancelled',
          message:
            `The action "${action.title}" was cancelled ` +
            'because its organization was closed.',
          link: `/actions/${action.action_id.toString()}`,
        });
      }
    }

    await this.realtimeGateway.emitAdminDirectoryChanged(
      'organizations',
    );

    await this.realtimeGateway.emitAdminDirectoryChanged(
      'actions',
    );

    return {
      ...updatedOrganization,
      organization_id: updatedOrganization.organization_id.toString(),
      creator_id: updatedOrganization.creator_id?.toString() ?? null,
    };
  }

  //10. reactiver une organisation
  async reactivate(id: string, currentUserId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: {
        organization_id: BigInt(id),
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organization_id_user_id: {
          organization_id: BigInt(id),
          user_id: BigInt(currentUserId),
        },
      },
    });

    const isAdmin = currentUser.role === RoleApp.ADMIN;

    const isCreator =
      organization.creator_id === BigInt(currentUserId);

    const isManagerOrOwner =
      membership?.status === MemberStatus.ACTIVE &&
      (
        membership.role === RoleOrg.MANAGER ||
        membership.role === RoleOrg.OWNER
      );

    if (organization.organization_status === OrganizationStatus.SUSPENDED) {
      if (!isAdmin) {
        throw new ForbiddenException(
          'Only an admin can reactivate a suspended organization',
        );
      }
    }

    else if (organization.organization_status === OrganizationStatus.CLOSED) {
      const activeOwner = await this.prisma.organizationMember.findFirst({
        where: {
          organization_id: BigInt(id),
          status: MemberStatus.ACTIVE,
          role: RoleOrg.OWNER,
        },
      });

      if (!activeOwner) {
        throw new ConflictException(
          'An organization without an owner requires administrator reassignment',
        );
      }

      if (!isAdmin && !isCreator && !isManagerOrOwner) {
        throw new ForbiddenException(
          'You are not allowed to reactivate this organization',
        );
      }
    }

    else {
      throw new BadRequestException(
        'Organization is already active',
      );
    }

    const updatedOrganization = await this.prisma.organization.update({
      where: {
        organization_id: BigInt(id),
      },
      data: {
        organization_status: OrganizationStatus.ACTIVE,
      },
    });

    this.realtimeGateway.emitOrganizationUpdated(id);

    return {
      ...updatedOrganization,
      organization_id: updatedOrganization.organization_id.toString(),
      creator_id: updatedOrganization.creator_id?.toString() ?? null,
    };
  }

  async reopenWithOwner(
    organizationId: string,
    adminId: string,
    newOwnerId: string,
  ) {
    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          const admin = await tx.user.findUnique({
            where: { user_id: BigInt(adminId) },
          });

          if (
            !admin ||
            admin.account_status !== AccountStatus.ACTIVE ||
            admin.role !== RoleApp.ADMIN
          ) {
            throw new ForbiddenException(
              'Only an active administrator can perform this action',
            );
          }

          const organization = await tx.organization.findUnique({
            where: { organization_id: BigInt(organizationId) },
          });

          if (!organization) {
            throw new NotFoundException('Organization not found');
          }

          if (organization.organization_status !== OrganizationStatus.CLOSED) {
            throw new BadRequestException('Organization is not closed');
          }

          const existingOwner = await tx.organizationMember.findFirst({
            where: {
              organization_id: BigInt(organizationId),
              status: MemberStatus.ACTIVE,
              role: RoleOrg.OWNER,
            },
          });

          if (existingOwner) {
            throw new ConflictException(
              'This organization already has an active owner',
            );
          }

          const newOwner = await tx.user.findUnique({
            where: { user_id: BigInt(newOwnerId) },
          });

          if (!newOwner || newOwner.account_status !== AccountStatus.ACTIVE) {
            throw new BadRequestException(
              'The new owner must be an active user',
            );
          }

          const existingMembership = await tx.organizationMember.findUnique({
            where: {
              organization_id_user_id: {
                organization_id: BigInt(organizationId),
                user_id: BigInt(newOwnerId),
              },
            },
          });

          if (existingMembership) {
            throw new ConflictException(
              'The selected user already has a membership in this organization',
            );
          }

          await tx.organizationMember.create({
            data: {
              organization_id: BigInt(organizationId),
              user_id: BigInt(newOwnerId),
              role: RoleOrg.OWNER,
              status: MemberStatus.ACTIVE,
              validated_by_org_man: true,
              validated_at: new Date(),
            },
          });

          await tx.organization.update({
            where: { organization_id: BigInt(organizationId) },
            data: { organization_status: OrganizationStatus.ACTIVE },
          });

          return { success: true };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      this.realtimeGateway.emitOrganizationUpdated(organizationId);
        return result;

    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'The organization changed. Please refresh and try again.',
        );
      }

      throw error;
    }
  }

  // Comments
  async addComment(organizationId: bigint, userId: bigint, comment: string) {
    const org = await this.prisma.organization.findUnique({
      where: { organization_id: organizationId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organization_id_user_id: {
          organization_id: organizationId,
          user_id: userId,
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

    if (!membership || membership.status !== MemberStatus.ACTIVE) {
      return {
        success: false as const,
        code: 'NOT_ACTIVE_MEMBER' as const,
        message: 'You must be an active member of this organization to comment',
      };
    }

    if (membership.user.account_status !== AccountStatus.ACTIVE) {
      return {
        success: false as const,
        code: 'ACCOUNT_NOT_ACTIVE' as const,
        message: 'Your account must be active to comment',
      };
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const createdComment = await this.prisma.$transaction(
          async (tx) => {
            const currentOrganization = await tx.organization.findUnique({
              where: { organization_id: organizationId },
              select: { organization_status: true },
            });

            if (!currentOrganization) {
              throw new NotFoundException('Organization not found');
            }

            if (currentOrganization.organization_status !== OrganizationStatus.ACTIVE) {
              return {
                success: false as const,
                code: 'ORGANIZATION_INACTIVE' as const,
                message: 'Comments are disabled while the organization is inactive.',
              };
            }
            const lastComment = await tx.organizationComment.findFirst({
              where: { user_id: userId },
              orderBy: { created_at: 'desc' },
            });

            if (lastComment) {
              const diffTime = (Date.now() - lastComment.created_at.getTime()) / 1000;

              if (diffTime < 15) {
                throw new HttpException(
                  'You can only post a comment every 15 seconds',
                  HttpStatus.TOO_MANY_REQUESTS,
                );
              }
            }

            return tx.organizationComment.create({
              data: {
                organization_id: organizationId,
                user_id: userId,
                content: comment,
              },
              include: {
                user: {
                  select: {
                    user_id: true,
                    profile: {
                      select: {
                        username: true,
                        profile_picture: true,
                      },
                    },
                  },
                },
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        if ('success' in createdComment) {
          return createdComment;
        }

        this.realtimeGateway.emitOrganizationCommentsChanged(
          organizationId.toString(),
        );

        const managers = await this.prisma.organizationMember.findMany({
          where: {
            organization_id: organizationId,
            status: MemberStatus.ACTIVE,
            role: {
              in: [RoleOrg.OWNER, RoleOrg.MANAGER],
            },
            user_id: {
              not: userId,
            },
            user: {
              account_status: AccountStatus.ACTIVE,
            },
          },
          select: {
            user_id: true,
          },
        });

        for (const manager of managers) {
          await this.notificationsService.notifyUser({
            userId: manager.user_id,
            type: NotificationType.ORGANIZATION_COMMENT,
            title: 'New organization comment',
            message: `A new comment was posted on "${org.title}".`,
            link: `/organizations/${org.organization_id.toString()}`,
          });
        }

        return createdComment;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < 2
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new BadRequestException(
      'Comment could not be posted, please try again',
    );
  }

  async getComments(organizationId: bigint) {
    const org = await this.prisma.organization.findUnique({
      where: {
        organization_id: organizationId,
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return this.prisma.organizationComment.findMany({
      where: { organization_id: organizationId, },
      orderBy: { created_at: 'desc', },
      include: {
        user: {
          select: {
            user_id: true,
            profile: {
              select: {
                username: true,
                profile_picture: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteComment(commentId: bigint, currentUserId: bigint) {
    const comment = await this.prisma.organizationComment.findUnique({
      where: {  comment_id: commentId },
      include: { organization: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const isAuthor = comment.user_id === currentUserId;
    const isOwner = comment.organization.creator_id === currentUserId;

    if (!isAuthor && !isOwner) {
      throw new ForbiddenException('You are not allowed to delete this comment');
    }

    await this.prisma.organizationComment.delete({
      where: { comment_id: commentId },
    });

    this.realtimeGateway.emitOrganizationCommentsChanged(
      comment.organization_id.toString(),
    );

    if (
      comment.user_id !== null &&
      comment.user_id !== currentUserId
    ) {
      await this.notificationsService.notifyUser({
        userId: comment.user_id,
        type: NotificationType.ORGANIZATION_COMMENT_DELETED,
        title: 'Your comment was removed',
        message: `Your comment on "${comment.organization.title}" was removed.`,
        link: `/organizations/${comment.organization_id.toString()}`,
      });
    }

    return { message: 'Comment deleted successfully' };
  }
}