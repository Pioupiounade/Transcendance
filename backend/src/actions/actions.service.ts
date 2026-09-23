import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { Category } from '../../generated/prisma/client';
import { ActionStatus, OrganizationStatus, RoleApp, RoleOrg, MemberStatus, AccountStatus, Prisma } from '../../generated/prisma/client';
import { PointtransactionService } from '../pointtransaction/pointtransaction.service';


@Injectable()
export class ActionsService {
 
  constructor(
      private prisma: PrismaService,
      private pointtransactionService: PointtransactionService,
 ) {}

//1. recuperer toutes les actions
// GET /actions
  async findAll() {
    const actions = await this.prisma.action.findMany();

    return Promise.all(
      actions.map((action) =>
        this.enrichActionWithParticipationData(action),
      ),
    );
  }

//2. recupere une action grace a son id
// GET /actions/:id
  async findOne(id: string) {
    const action = await this.prisma.action.findUnique({
      where: {
        action_id: BigInt(id),
      },
    });

    if(!action) {
      throw new NotFoundException('Action not found');
    }

    const participantCount = await this.prisma.participation.count({
      where: {
        action_id: action.action_id,
      },
    });

    const remainingSeats =
      action.max_participants === null
        ? null
        : Math.max(action.max_participants - participantCount, 0);

    return {
      ...action,
      action_id: action.action_id.toString(),
      creator_id: action.creator_id.toString(),
      organization_id: action.organization_id?.toString() ?? null,
      validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
      participant_count: participantCount,
      remaining_seats: remainingSeats,
    };
  }

//3. recupere des actions par organization
// GET /actions?organization_id=2
  async findByOrganization(id: string) {
    const actions = await this.prisma.action.findMany({
      where: {
        organization_id: BigInt(id),
      },
    });

    if(actions.length === 0) {
      throw new NotFoundException('No actions found for this organization');
    }
    
    return Promise.all(
      actions.map((action) =>
        this.enrichActionWithParticipationData(action),
      ),
    );
  }

//4. recupere des actions par categorie
// GET /actions?category=ENVIRONMENT
  async findByCategory(category: Category) {
    const actions = await this.prisma.action.findMany({
      where: {
        category: category,
      },
    });

    if(actions.length === 0) {
      throw new NotFoundException('No actions found for this category');
    }
    
    return Promise.all(
      actions.map((action) =>
        this.enrichActionWithParticipationData(action),
      ),
    );
  }

//5. recupere des actions par createur
// GET /actions?creator_id=1
  async findByCreator(id: string) {
    const actions = await this.prisma.action.findMany({
      where: {
        creator_id: BigInt(id)
      },
    });

    if(actions.length === 0) {
      throw new NotFoundException('No actions found for this user');
    }
    
    return Promise.all(
      actions.map((action) =>
        this.enrichActionWithParticipationData(action),
      ),
    );
  }

//6. recupere des actions par statut
// GET /actions?status=APPROVED
  async findByStatus(status: ActionStatus) {
    const actions = await this.prisma.action.findMany({
      where: {
        status: status,
      },
    });

    if(actions.length === 0) {
      throw new NotFoundException('No actions found for this status');
    }
    
    return Promise.all(
      actions.map((action) =>
        this.enrichActionWithParticipationData(action),
      ),
    );
  }

//7. recuperer des actions par zone
  async findByRadius(lat: number, lng: number, radiusKm: number) {
      const actions = await this.prisma.action.findMany();

      const nearbyActions = actions.filter((action) => {
        const [actLat, actLng] = action.location;

        const distance = this.calculateDistance(
          lat,
          lng,
          actLat,
          actLng,
        );

        return distance <= radiusKm;
      });

      return Promise.all(
        nearbyActions.map((action) =>
          this.enrichActionWithParticipationData(action),
        ),
      );
  }

  private async enrichActionWithParticipationData(action: any) {
    const participantCount = await this.prisma.participation.count({
      where: {
        action_id: action.action_id,
      },
    });

    return {
      ...action,
      action_id: action.action_id.toString(),
      creator_id: action.creator_id.toString(),
      organization_id: action.organization_id?.toString() ?? null,
      validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
      participant_count: participantCount,
      remaining_seats:
        action.max_participants === null
          ? null
          : Math.max(action.max_participants - participantCount, 0),
    };
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    ): number {
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

  //8. creer une nouvelle action
  async create(currentUserId: string, data: CreateActionDto) {
    const creator = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    if (creator.account_status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Only an active user can create an action');
    }

    let organizationId: bigint | null = null;

    if (data.organization_id) {
      organizationId = BigInt(data.organization_id);

      const organization = await this.prisma.organization.findUnique({
        where: {
          organization_id: organizationId,
        },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      if (organization.organization_status !== OrganizationStatus.ACTIVE) {
        throw new BadRequestException(
          'Only an active organization can create an action',
        );
      }

      if (creator.role !== RoleApp.ADMIN) {
        const membership = await this.prisma.organizationMember.findUnique({
          where: {
            organization_id_user_id: {
              organization_id: organizationId,
              user_id: creator.user_id,
            },
          },
        });

        const canCreateForOrganization =
          membership?.status === MemberStatus.ACTIVE &&
          (
            membership.role === RoleOrg.MANAGER ||
            membership.role === RoleOrg.OWNER
          );

        if (!canCreateForOrganization) {
          throw new ForbiddenException(
            'You are not allowed to create an action for this organization',
          );
        }
      }
    }

    if (
      data.max_participants !== undefined &&
      data.max_participants < 3
    ) {
      throw new BadRequestException(
        'Maximum participants cannot be lower than minimum participants',
      );
    }
    
    const createdAction = await this.prisma.action.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        scheduled_at: data.scheduled_at,
        imagesList: data.imagesList ?? [],
        organization_id: organizationId,
        max_participants: data.max_participants,
        creator_id: BigInt(currentUserId),
      },
    });

    return createdAction;
  }

  //9. mettre a jour les donnees de l'action
  async update( id: string, data: UpdateActionDto, currentUserId: string) {
    const action = await this.prisma.action.findUnique({
      where: {
        action_id: BigInt(id),
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (action.status === ActionStatus.CANCELLED || action.status === ActionStatus.COMPLETED ||
      action.status === ActionStatus.REJECTED) {
      throw new BadRequestException('This action can no longer be modified');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = currentUser.role === RoleApp.ADMIN;

    const isCreator =  action.creator_id === BigInt(currentUserId);

    let isManagerOrOwner = false;

    if (action.organization_id) {
      const membership = await this.prisma.organizationMember.findUnique({
          where: {
            organization_id_user_id: {
              organization_id: action.organization_id,
              user_id: BigInt(currentUserId),
            },
          },
        });

      isManagerOrOwner = membership?.status === MemberStatus.ACTIVE &&
        (membership.role === RoleOrg.MANAGER || membership.role === RoleOrg.OWNER);
    }

    if (!isAdmin && !isCreator && !isManagerOrOwner) {
      throw new ForbiddenException('You are not allowed to update this action');
    }
    
    let newOrganizationId: bigint | undefined;

    if (data.organization_id !== undefined) {
      newOrganizationId = BigInt(data.organization_id);

      const newOrganization = await this.prisma.organization.findUnique({
        where: {
          organization_id: newOrganizationId,
        },
      });

      if (!newOrganization) {
        throw new NotFoundException('Organization not found');
      }

      if (
        newOrganization.organization_status !== OrganizationStatus.ACTIVE
      ) {
        throw new BadRequestException(
          'Only an active organization can be assigned to an action',
        );
      }

      if (!isAdmin) {
        const newMembership =
          await this.prisma.organizationMember.findUnique({
            where: {
              organization_id_user_id: {
                organization_id: newOrganizationId,
                user_id: BigInt(currentUserId),
              },
            },
          });

        const canAssignOrganization =
          newMembership?.status === MemberStatus.ACTIVE &&
          (
            newMembership.role === RoleOrg.MANAGER ||
            newMembership.role === RoleOrg.OWNER
          );

        if (!canAssignOrganization) {
          throw new ForbiddenException(
            'You are not allowed to assign this action to this organization',
          );
        }
      }
    }

    const updatedAction = await this.prisma.action.update({
      where: {
        action_id: BigInt(id),
      },
      data: {
        title: data.title,
        description: data.description,
        organization_id: newOrganizationId,
        location: data.location,
        category: data.category,
        imagesList: data.imagesList,
        scheduled_at: data.scheduled_at ? new Date(data.scheduled_at) : undefined,
      },
    });

      const newOrganization = await this.prisma.organization.findUnique({
        where: {
          organization_id: newOrganizationId,
        },
      });

      if (!newOrganization) {
        throw new NotFoundException('Organization not found');
      }

      if (
        newOrganization.organization_status !== OrganizationStatus.ACTIVE
      ) {
        throw new BadRequestException(
          'Only an active organization can be assigned to an action',
        );
      }

      if (!isAdmin) {
        const newMembership =
          await this.prisma.organizationMember.findUnique({
            where: {
              organization_id_user_id: {
                organization_id: newOrganizationId,
                user_id: BigInt(currentUserId),
              },
            },
          });

        const canAssignOrganization =
          newMembership?.status === MemberStatus.ACTIVE &&
          (
            newMembership.role === RoleOrg.MANAGER ||
            newMembership.role === RoleOrg.OWNER
          );

        if (!canAssignOrganization) {
          throw new ForbiddenException(
            'You are not allowed to assign this action to this organization',
          );
        }
      }
    }

      let updatedAction;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          updatedAction = await this.prisma.$transaction(
            async (tx) => {
              if (data.max_participants !== undefined) {
                if (
                  data.max_participants < action.min_participants
                ) {
                  throw new BadRequestException(
                    'Maximum participants cannot be lower than minimum participants',
                  );
                }

                const participantCount =
                  await tx.participation.count({
                    where: {
                      action_id: action.action_id,
                    },
                  });

                if (
                  data.max_participants < participantCount
                ) {
                  throw new BadRequestException(
                    'Maximum participants cannot be lower than current participants count',
                  );
                }
              }

              return tx.action.update({
                where: {
                  action_id: BigInt(id),
                },
                data: {
                  title: data.title,
                  description: data.description,
                  organization_id: newOrganizationId,
                  location: data.location,
                  category: data.category,
                  imagesList: data.imagesList,
                  max_participants: data.max_participants,
                  scheduled_at: data.scheduled_at
                    ? new Date(data.scheduled_at)
                    : undefined,
                },
              });
            },
            {
              isolationLevel:
                Prisma.TransactionIsolationLevel.Serializable,
            },
          );

          break;
        } catch (error) {
          if (
            error instanceof
              Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2034'
          ) {
            if (attempt < 2) {
              continue;
            }

            throw new BadRequestException(
              'Action capacity was modified concurrently, please try again',
            );
          }

          throw error;
        }
      }

      if (!updatedAction) {
        throw new BadRequestException(
          'Action could not be updated, please try again',
        );
      }

      return {
        ...updatedAction,
        action_id: updatedAction.action_id.toString(),
        creator_id: updatedAction.creator_id.toString(),
        organization_id:
          updatedAction.organization_id?.toString() ?? null,
        validated_by_user_id:
          updatedAction.validated_by_user_id?.toString() ?? null,
      };
}

//10. approuver une action
  async approve(id: string, currentUserId: string) {
    const action = await this.prisma.action.findUnique({
      where: {
        action_id: BigInt(id),
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (action.status !== ActionStatus.PENDING) {
      throw new BadRequestException('This action can no longer be approved');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = currentUser.role === RoleApp.ADMIN;

    const isCreator = action.creator_id === BigInt(currentUserId);

    let isManagerOrOwner = false;

    if (action.organization_id) {
      const organization = await this.prisma.organization.findUnique({
        where: {
          organization_id: action.organization_id,
        },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      if ( organization.organization_status !==  OrganizationStatus.ACTIVE
      ) {
        throw new BadRequestException('Only an active organization can approve an action');
      }

      const membership =
        await this.prisma.organizationMember.findUnique({
          where: {
            organization_id_user_id: {
              organization_id: action.organization_id,
              user_id: BigInt(currentUserId),
            },
          },
        });

      isManagerOrOwner = membership?.status === MemberStatus.ACTIVE &&
        (membership.role === RoleOrg.MANAGER || membership.role === RoleOrg.OWNER);
    }

    if (!isAdmin && !isCreator && !isManagerOrOwner) {
      throw new ForbiddenException('You are not allowed to approve this action');
    }

    const participantCount = await this.prisma.participation.count({
      where: {
        action_id: BigInt(id),
        user_id: {
          not: action.creator_id,
        },
      },
    });

    if (participantCount < action.min_participants) {
      throw new BadRequestException(`An action needs at least ${action.min_participants} participants to be approved`);
    }

    const updatedAction = await this.prisma.action.update({
      where: {
        action_id: BigInt(id),
      },
      data: {
        status: ActionStatus.APPROVED,
        validated_by_user_id: BigInt(currentUserId),
        validated_at: new Date(),
      },
    });

    return {
      ...updatedAction,
      action_id: updatedAction.action_id.toString(),
      creator_id: updatedAction.creator_id.toString(),
      organization_id: updatedAction.organization_id?.toString() ?? null,
      validated_by_user_id: updatedAction.validated_by_user_id?.toString() ?? null,
    };
  }

//11. annuler une action
  async cancel(id: string, currentUserId: string) {
     const action = await this.prisma.action.findUnique({
      where: {
        action_id: BigInt(id),
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (action.status !== ActionStatus.PENDING && action.status !== ActionStatus.APPROVED) {
      throw new BadRequestException('This action can no longer be cancelled');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = currentUser.role === RoleApp.ADMIN;

    const isCreator = action.creator_id === BigInt(currentUserId);

    let isManagerOrOwner = false;

    if (action.organization_id) {
      const organization = await this.prisma.organization.findUnique({
        where: {
          organization_id: action.organization_id,
        },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      const membership =
        await this.prisma.organizationMember.findUnique({
          where: {
            organization_id_user_id: {
              organization_id: action.organization_id,
              user_id: BigInt(currentUserId),
            },
          },
        });

      isManagerOrOwner = membership?.status === MemberStatus.ACTIVE &&
        (membership.role === RoleOrg.MANAGER || membership.role === RoleOrg.OWNER);

      if (organization.organization_status !== OrganizationStatus.ACTIVE && !isAdmin) {
        throw new ForbiddenException('Only an admin can cancel an action from an inactive organization');
      }
    }

    if (!isAdmin && !isCreator && !isManagerOrOwner) {
      throw new ForbiddenException('You are not allowed to cancel this action');
    }

    const updatedAction = await this.prisma.action.update({
      where: {
        action_id: BigInt(id),
      },
      data: {
        status: ActionStatus.CANCELLED,
      },
    });

    return {
      ...updatedAction,
      action_id: updatedAction.action_id.toString(),
      creator_id: updatedAction.creator_id.toString(),
      organization_id: updatedAction.organization_id?.toString() ?? null,
      validated_by_user_id: updatedAction.validated_by_user_id?.toString() ?? null,
    };
  }

//12. terminer une action
  async complete(id: string, currentUserId: string) {
     const action = await this.prisma.action.findUnique({
      where: {
        action_id: BigInt(id),
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (action.status !== ActionStatus.APPROVED) {
      throw new BadRequestException('This action cannot be completed');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = currentUser.role === RoleApp.ADMIN;

    const isCreator = action.creator_id === BigInt(currentUserId);

    let isManagerOrOwner = false;

    if (action.organization_id) {
      const organization = await this.prisma.organization.findUnique({
        where: {
          organization_id: action.organization_id,
        },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      if (
        organization.organization_status !== OrganizationStatus.ACTIVE &&
        !isAdmin
      ) {
          throw new ForbiddenException('Only an admin can complete an action from an inactive organization');
        }

      const membership = await this.prisma.organizationMember.findUnique({
        where: {
          organization_id_user_id: {
            organization_id: action.organization_id,
            user_id: BigInt(currentUserId),
          },
        },
      });

      isManagerOrOwner =
        membership?.status === MemberStatus.ACTIVE &&
        (
          membership.role === RoleOrg.MANAGER ||
          membership.role === RoleOrg.OWNER
        );
    }

    if (!isAdmin && !isCreator && !isManagerOrOwner) {
      throw new ForbiddenException('You are not allowed to complete this action');
    }

    const updatedAction = await this.prisma.$transaction(
      async (tx) => {
        const participantCount = await tx.participation.count({
          where: {
            action_id: BigInt(id),
            user_id: {
              not: action.creator_id,
            },
          },
        });

        if (participantCount < action.min_participants) {
          throw new BadRequestException(`An action needs at least ${action.min_participants} participants to be completed`);
        }

        const completedAction = await tx.action.update({
          where: {
            action_id: BigInt(id),
          },
          data: {
            status: ActionStatus.COMPLETED,
          },
        });

      await this.pointtransactionService.rewardActionCompleted(
        BigInt(id),
        tx,
      );

    const participations = await tx.participation.findMany({
      where: {
        action_id: BigInt(id),
      },
    });

    for (const participation of participations) {
      await this.pointtransactionService.rewardParticipation(
        BigInt(id),
        participation.user_id,
        tx,
      );

    await this.pointtransactionService.rewardCreatorForParticipant(
        BigInt(id),
        participation.user_id,
        tx,
      );
    }
      return completedAction;
    },
    );

    return {
    ...updatedAction,
    action_id: updatedAction.action_id.toString(),
    creator_id: updatedAction.creator_id.toString(),
    organization_id: updatedAction.organization_id?.toString() ?? null,
    validated_by_user_id: updatedAction.validated_by_user_id?.toString() ?? null,
    };
  }
}