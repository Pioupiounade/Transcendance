import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { Category } from '../../generated/prisma/client';
import { ActionStatus, OrganizationStatus, RoleApp, RoleOrg, MemberStatus, AccountStatus } from '../../generated/prisma/client';

@Injectable()
export class ActionsService {
 
  constructor(private prisma: PrismaService) {}

//1. recuperer toutes les actions
// GET /actions
async findAll() {
  const actions = await this.prisma.action.findMany();

  return actions.map((action) => ({
    ...action,
    action_id: action.action_id.toString(),
    creator_id: action.creator_id.toString(),
    organization_id: action.organization_id?.toString() ?? null,
    validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
  }));
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
    
    return {
      ...action,
      action_id: action.action_id.toString(),
      creator_id: action.creator_id.toString(),
      organization_id: action.organization_id?.toString() ?? null,
      validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
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
    
    return actions.map((action) => ({
      ...action,
      action_id: action.action_id.toString(),
      creator_id: action.creator_id.toString(),
      organization_id: action.organization_id?.toString() ?? null,
      validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
      }));
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
    
    return actions.map((action) => ({
      ...action,
      action_id: action.action_id.toString(),
      creator_id: action.creator_id.toString(),
      organization_id: action.organization_id?.toString() ?? null,
      validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
      }));
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
    
    return actions.map((action) => ({
      ...action,
      action_id: action.action_id.toString(),
      creator_id: action.creator_id.toString(),
      organization_id: action.organization_id?.toString() ?? null,
      validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
      }));
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
    
    return actions.map((action) => ({
      ...action,
      action_id: action.action_id.toString(),
      creator_id: action.creator_id.toString(),
      organization_id: action.organization_id?.toString() ?? null,
      validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
      }));
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

    return nearbyActions.map((action) => ({
      ...action,
      action_id: action.action_id.toString(),
      creator_id: action.creator_id.toString(),
      organization_id: action.organization_id?.toString() ?? null,
      validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
      }));
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
  async create(data: CreateActionDto) {
    const creator = await this.prisma.user.findUnique({
     where: {
      user_id: BigInt(data.creator_id),
    },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    if (creator.account_status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Only an active user can create an action');
    }

    if (data.organization_id) {
      const organization = await this.prisma.organization.findUnique({
        where: {
          organization_id: BigInt(data.organization_id),
        },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      if (organization.organization_status !== OrganizationStatus.ACTIVE) {
        throw new BadRequestException('Only an active organization can create an action');
      }
}
    const createdAction = await this.prisma.action.create({
      data: {
        title: data.title,
        description: data.description,
        creator_id: BigInt(data.creator_id),
        organization_id: data.organization_id? BigInt(data.organization_id) : null,
        location: data.location,
        category: data.category,
        imagesList: data.imagesList,
        scheduled_at: new Date(data.scheduled_at),
      },
    });

    return {
      ...createdAction,
      action_id: createdAction.action_id.toString(),
      creator_id: createdAction.creator_id.toString(),
      organization_id: createdAction.organization_id?.toString() ?? null,
      validated_by_user_id: createdAction.validated_by_user_id?.toString() ?? null,
      };
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

    const updatedAction = await this.prisma.action.update({
      where: {
        action_id: BigInt(id),
      },
      data: {
        title: data.title,
        description: data.description,
        organization_id: data.organization_id ? BigInt(data.organization_id) : undefined,
        location: data.location,
        category: data.category,
        imagesList: data.imagesList,
        scheduled_at: data.scheduled_at ? new Date(data.scheduled_at) : undefined,
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
        throw new ForbiddenException(
          'Only an admin can complete an action from an inactive organization',
        );
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

    const updatedAction = await this.prisma.action.update({
      where: {
        action_id: BigInt(id),
      },
      data: {
        status: ActionStatus.COMPLETED,
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
}