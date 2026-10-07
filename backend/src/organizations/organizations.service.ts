import { Injectable, NotFoundException, BadRequestException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AccountStatus, RoleApp, RoleOrg, MemberStatus, OrganizationStatus, Prisma, NotificationType } from '../../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrganizationsService {

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) { }

  //1. recuperer toutes les organisations
  async findAll() {
    const organizations = await this.prisma.organization.findMany();

    return organizations.map((organization) => ({
      ...organization,
      organization_id: organization.organization_id.toString(),
      creator_id: organization.creator_id.toString(),
    }));
  }

  //2. recupere une organisation grace a son id
  async findOne(id: string) { // Nest JS recupere l'id de l'URL comme un string
    const organization = await this.prisma.organization.findUnique({
      where: {
        organization_id: BigInt(id), // cherche dans la PostgreSQL apres avoir converti le string en BigInt
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // On retourne l'organisation avec son BigInt converti en string
    return {
      ...organization,
      organization_id: organization.organization_id.toString(),
      creator_id: organization.creator_id.toString(),
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
      creator_id: organization.creator_id.toString(),
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
      creator_id: organization.creator_id.toString(),
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
      creator_id: organization.creator_id.toString(),
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
    const createdOrganization = await this.prisma.organization.create({
      data: {
        title: data.title,
        description: data.description,
        address: data.address,
        location: data.location,
        creator_id: BigInt(currentUserId),
      },
    });

    return {
      ...createdOrganization,
      organization_id: createdOrganization.organization_id.toString(),
      creator_id: createdOrganization.creator_id.toString(),
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
      creator_id: updatedOrganization.creator_id.toString(),
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

    return {
      ...updatedOrganization,
      organization_id: updatedOrganization.organization_id.toString(),
      creator_id: updatedOrganization.creator_id.toString(),
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

    const updatedOrganization = await this.prisma.organization.update({
      where: {
        organization_id: BigInt(id),
      },
      data: {
        organization_status: OrganizationStatus.CLOSED,
      },
    });

    return {
      ...updatedOrganization,
      organization_id: updatedOrganization.organization_id.toString(),
      creator_id: updatedOrganization.creator_id.toString(),
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

    return {
      ...updatedOrganization,
      organization_id: updatedOrganization.organization_id.toString(),
      creator_id: updatedOrganization.creator_id.toString(),
    };
  }

  // Comments

  async addComment(organizationId: bigint, userId: bigint, comment: string) {
    const org = await this.prisma.organization.findUnique({
      where: { organization_id: organizationId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const createdComment = await this.prisma.$transaction(
          async (tx) => {
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

    return { message: 'Comment deleted successfully' };
  }
}