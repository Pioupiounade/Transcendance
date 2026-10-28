import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountStatus, ActionStatus, Prisma, NotificationType } from '../../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class ParticipationsService {
  constructor(
  private prisma: PrismaService,
  private notificationsService: NotificationsService,
  private realtimeGateway: RealtimeGateway,

) {}

//participer a une action
  async participate(currentUserId: string, actionId: string) {
    const userId = BigInt(currentUserId);
    const actionIdBigInt = BigInt(actionId);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
            const result = await this.prisma.$transaction(          async (tx) => {
            const user = await tx.user.findUnique({
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

            const action = await tx.action.findUnique({
              where: {
                action_id: actionIdBigInt,
              },
            });

            if (!action) {
              throw new NotFoundException('Action not found');
            }

            if (action.creator_id === userId) {
              throw new BadRequestException('The action creator cannot participate in their own action');
            }

            if (action.status !== ActionStatus.PENDING) {
              throw new BadRequestException(
                'You can only join a pending action',
              );
            }

            const existingParticipation =
              await tx.participation.findUnique({
                where: {
                  action_id_user_id: {
                    action_id: actionIdBigInt,
                    user_id: userId,
                  },
                },
              });
            
            if (existingParticipation) {
              throw new BadRequestException(
                'User already participates to this action',
              );
            }  

            const beforeCount = await tx.participation.count({
              where: {
                action_id: actionIdBigInt,
              },
            });

            const effectiveMaximum = Math.min(action.max_participants ?? 100, 100);

            if (beforeCount >= effectiveMaximum) {
              throw new BadRequestException(
                'Maximum number of participants reached',
              );
            }

            const participation = await tx.participation.create({
              data: {
                action_id: actionIdBigInt,
                user_id: userId,
              },
            });

            return {
              participation,
              action,
              beforeCount,
              afterCount: beforeCount + 1,
            };
          },
          {
            isolationLevel:
              Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        const {
          participation,
          action,
          beforeCount,
          afterCount,
        } = result;

        this.realtimeGateway.emitActionParticipantsChanged(actionId);

        await this.notificationsService.notifyUser({
          userId: action.creator_id,
          type: NotificationType.ACTION_PARTICIPATION_CHANGED,
          title: 'New participant',
          message: `Someone joined your action "${action.title}".`,
          link: `/actions/${action.action_id.toString()}`,
        });

        if (
          beforeCount < action.min_participants &&
          afterCount >= action.min_participants
        ) {
          await this.notificationsService.notifyUser({
            userId: action.creator_id,
            type: NotificationType.ACTION_MIN_REACHED,
            title: 'Minimum participants reached',
            message: `Your action "${action.title}" has reached its minimum number of participants.`,
            link: `/actions/${action.action_id.toString()}`,
          });
        }

        if (
          action.max_participants !== null &&
          beforeCount < action.max_participants &&
          afterCount >= action.max_participants
        ) {
          await this.notificationsService.notifyUser({
            userId: action.creator_id,
            type: NotificationType.ACTION_MAX_REACHED,
            title: 'Maximum participants reached',
            message: `Your action "${action.title}" has reached its maximum number of participants.`,
            link: `/actions/${action.action_id.toString()}`,
          });
        }
        return {
          ...participation,
          action_id: participation.action_id.toString(),
          user_id: participation.user_id.toString(),
        };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < 2
        ) {
          continue;
        }

        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new BadRequestException('User already participates to this action');
        }

        throw error;
      }
    }

    throw new BadRequestException('Participation could not be created, please try again');
  }

  //annuler sa participation
  async cancelParticipation(currentUserId: string, actionId: string) {
    const userId = BigInt(currentUserId);
    const actionIdBigInt = BigInt(actionId);

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { participation, action } = await this.prisma.$transaction(
          async (tx) => {
            const user = await tx.user.findUnique({
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

            const action = await tx.action.findUnique({
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

            const existingParticipation = await tx.participation.findUnique({
              where: {
                action_id_user_id: {
                  action_id: actionIdBigInt,
                  user_id: userId,
                },
              },
            });

            if (!existingParticipation) {
              throw new NotFoundException('Participation not found');
            }

            await tx.participation.delete({
              where: {
                action_id_user_id: {
                  action_id: actionIdBigInt,
                  user_id: userId,
                },
              },
            });

            return {
              participation: existingParticipation,
              action,
            };
          },
          {
            isolationLevel:
              Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        this.realtimeGateway.emitActionParticipantsChanged(actionId);

        await this.notificationsService.notifyUser({
          userId: action.creator_id,
          type: NotificationType.ACTION_PARTICIPATION_CHANGED,
          title: 'Participant left',
          message: `Someone left your action "${action.title}".`,
          link: `/actions/${action.action_id.toString()}`,
        });

        return {
          ...participation,
          action_id: participation.action_id.toString(),
          user_id: participation.user_id.toString(),
        };
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

    throw new BadRequestException('Participation could not be cancelled, please try again');
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

    if ( action.status !== ActionStatus.PENDING && action.status !== ActionStatus.APPROVED && action.status !== ActionStatus.CANCELLED &&
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
