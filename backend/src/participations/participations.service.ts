import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountStatus, ActionStatus } from '../../generated/prisma/client';

@Injectable()
export class ParticipationsService {
  constructor(private prisma: PrismaService) {}

//participer a une action
  async participate(currentUserId: string, actionId: string) {
    const userId = BigInt(currentUserId);
    const actionIdBigInt = BigInt(actionId);

    const user = await this.prisma.user.findUnique({
      where: {
        user_id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Only an active user can participate to an action');
    }

    const action = await this.prisma.action.findUnique({
      where: {
        action_id: actionIdBigInt,
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (action.status !== ActionStatus.PENDING) {
      throw new BadRequestException('You can only join a pending action');
    }

    const existingParticipation = await this.prisma.participation.findUnique({
        where: {
          action_id_user_id: {
            action_id: actionIdBigInt,
            user_id: userId,
          },
        },
      });

    if (existingParticipation) {
      throw new BadRequestException('User already participates to this action');
    }

    if (action.max_participants !== null) {
      const currentParticipants = await this.prisma.participation.count({
          where: {
            action_id: actionIdBigInt,
          },
        });

      if (currentParticipants >= action.max_participants) {
        throw new BadRequestException('Maximum number of participants reached');
      }
    }

    const participation = await this.prisma.participation.create({
        data: {
          action_id: actionIdBigInt,
          user_id: userId,
        },
      });

    return {
      ...participation,
      action_id: participation.action_id.toString(),
      user_id: participation.user_id.toString(),
    };
  }

  //annuler sa participation
  async cancelParticipation(currentUserId: string, actionId: string) {
    const userId = BigInt(currentUserId);
    const actionIdBigInt = BigInt(actionId);

    const user = await this.prisma.user.findUnique({
      where: {
        user_id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Only an active user can cancel a participation');
    }

    const action = await this.prisma.action.findUnique({
      where: {
        action_id: actionIdBigInt,
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (action.status !== ActionStatus.PENDING) {
      throw new BadRequestException('Participation can only be cancelled while the action is pending');
    }

    const participation = await this.prisma.participation.findUnique({
        where: {
          action_id_user_id: {
            action_id: actionIdBigInt,
            user_id: userId,
          },
        },
      });

    if (!participation) {
      throw new NotFoundException('Participation not found');
    }

    const deletedParticipation = await this.prisma.participation.delete({
        where: {
          action_id_user_id: {
            action_id: actionIdBigInt,
            user_id: userId,
          },
        },
      });

    return {
      ...deletedParticipation,
      action_id: deletedParticipation.action_id.toString(),
      user_id: deletedParticipation.user_id.toString(),
    };
  }

//voir tous les participants d'une action
  async findParticipantsByAction(actionId: string) {
    const actionIdBigInt = BigInt(actionId);

    const action = await this.prisma.action.findUnique({
      where: {
        action_id: actionIdBigInt,
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if ( action.status !== ActionStatus.PENDING && action.status !== ActionStatus.APPROVED &&
      action.status !== ActionStatus.COMPLETED) {
      throw new BadRequestException('Participants are not available for this action status');
    }

    const participations =
      await this.prisma.participation.findMany({
        where: {
          action_id: actionIdBigInt,
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      });

    return participations.map((participation) => ({
      user_id: participation.user_id.toString(),
      username:
        participation.user.profile?.username ?? null,
      profile_picture:
        participation.user.profile?.profile_picture ?? null,
      created_at: participation.created_at,
    }));
  }

  //voir toutes les actions auxquelles je participe
  async findMyParticipations(currentUserId: string) {
    const userId = BigInt(currentUserId);

    const user = await this.prisma.user.findUnique({
      where: {
        user_id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Only an active user can see own participations');
    }

    const participations = await this.prisma.participation.findMany({
        where: {
          user_id: userId,
          action: {
            status: {
              in: [
                ActionStatus.PENDING,
                ActionStatus.APPROVED,
                ActionStatus.COMPLETED,
              ],
            },
          },
        },
        include: {
          action: true,
        },
      });

    return participations.map((participation) => ({
      action_id: participation.action.action_id.toString(),
      title: participation.action.title,
      description: participation.action.description,
      status: participation.action.status,
      category: participation.action.category,
      scheduled_at: participation.action.scheduled_at,
      created_at: participation.created_at,
      organization_id:
        participation.action.organization_id?.toString() ?? null,
    }));
  }

  // retirer les participations ouvertes d'un user suspendu ou désactivé
  async removeOpenParticipationsForInactiveUser(userId: string) {
    const userIdBigInt = BigInt(userId);

    const user = await this.prisma.user.findUnique({
      where: {
        user_id: userIdBigInt,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.account_status === AccountStatus.ACTIVE) {
      throw new BadRequestException('User is still active');
    }

    const openParticipations = await this.prisma.participation.findMany({
        where: {
          user_id: userIdBigInt,
          action: {
            status: ActionStatus.PENDING,
          },
        },
      });

    if (openParticipations.length === 0) {
      return {
        deleted_count: 0,
      };
    }

    const result = await this.prisma.participation.deleteMany({
        where: {
          user_id: userIdBigInt,
          action: {
            status: ActionStatus.PENDING,
          },
        },
      });

    return {
      deleted_count: result.count,
    };
  }
}
