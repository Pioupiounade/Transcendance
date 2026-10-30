import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as argon2 from 'argon2';
import {
  AccountStatus,
  ActionStatus,
  Prisma,
  RoleApp,
  MemberStatus,
  RoleOrg,
  OrganizationStatus,
  NotificationType,
} from '../../generated/prisma/client';
import { PointtransactionService } from '../pointtransaction/pointtransaction.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  // UsersService recoit PrismaService par injection. 
  constructor(
    private prisma: PrismaService,
    private pointtransactionService: PointtransactionService,
    private realtimeGateway: RealtimeGateway,
    private notificationsService: NotificationsService,
  ) { }

  // Utllise this.prisma pour recuperer les Users dans PostgreSQL. Cette methode metier accede reellement a la BDD via Prisma
  //1. recuperer tous les utilisateurs
  async findAll(requesterId: string) {
    const requester = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(requesterId),
      },
    });

    if (
      !requester ||
      requester.role !== RoleApp.ADMIN ||
      requester.account_status !== AccountStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'Only an active admin can view all accounts',
      );
    }
    const users = await this.prisma.user.findMany({
      include: {
        _count: {
          select: {
            organization_members: {
              where: {
                role: RoleOrg.OWNER,
                status: MemberStatus.ACTIVE,
              },
            },
          },
        },
        organization_members: {
          where: {
            role: RoleOrg.OWNER,
            status: MemberStatus.ACTIVE,
          },
          select: {
            organization: {
              select: {
                title: true,
                members: {
                  where: {
                    status: MemberStatus.ACTIVE,
                    user: {
                      account_status: AccountStatus.ACTIVE,
                    },
                  },
                  select: {
                    user_id: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return users.map(
      ({
        password_hash,
        refresh_token,
        _count,
        organization_members,
        ...user
      }) => {
        const blockingOwnership = organization_members.find(
          (membership) =>
            membership.organization.members.some(
              (member) => member.user_id !== user.user_id,
            ),
        );

        return {
          ...user,
          user_id: user.user_id.toString(),
          deletionBlockedByOwnership:
            _count.organization_members > 0,
          blockingOwnershipOrganization:
            blockingOwnership?.organization.title ?? null,
        };
      },
    );
  }

  //2. hasher le mdp - creer le nouvel utilisateur - l'id se genere automatiquement
  async create(data: CreateUserDto) {
    const email = data.email.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already used');
    }

    const password_hash = await argon2.hash(data.password);

    const createdUser = await this.prisma.user.create({
      data: {
        email: email,
        password_hash,
      },
    });

    const {
      password_hash: _,
      refresh_token: __,
      ...user
    } = createdUser;

    await this.realtimeGateway.emitAdminDirectoryChanged('users');

    return {
      ...user,
      user_id: user.user_id.toString(),
    };
  }

  async findOneByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    return user;
  }

  //3. recupere un utilisateur grace a son id
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(id),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const {
      password_hash,
      ...safeUser
    } = user;

    return {
      ...safeUser,
      user_id: safeUser.user_id.toString(),
    };
  }

  async findOneSafe(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(id),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const {
      password_hash,
      refresh_token,
      ...safeUser
    } = user;

    return {
      ...safeUser,
      user_id: safeUser.user_id.toString(),
    };
  }

  async updateLastSeen(id: string) {
    const user = await this.prisma.user.update({
      where: {
        user_id: BigInt(id),
      },
      data: {
        last_seen_at: new Date(),
      },
      select: {
        user_id: true,
        last_seen_at: true,
      },
    });

    return {
      user_id: user.user_id.toString(),
      last_seen_at: user.last_seen_at,
    };
  }

  //4. mettre a jour l'adresse mail
  async updateEmail(id: string, data: UpdateUserDto) {
    const email = data.email?.toLowerCase(); // Convert email to lowercase
    if (data.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (existingUser && existingUser.user_id !== BigInt(id)) {
        throw new BadRequestException('Email is already used');
      }
    }

    const user = await this.prisma.user.update({
      where: {
        user_id: BigInt(id),
      },
      data: {
        email: email,
      },
    });

    const {
      password_hash,
      refresh_token,
      ...safeUser
    } = user;

    // On retourne l'utilisateur avec son BigInt converti en string
    return {
      ...safeUser,
      user_id: safeUser.user_id.toString(),
    };
  }

  //5. mettre a jour le mdp
  async updatePassword(id: string, data: UpdatePasswordDto) {
    const password_hash = await argon2.hash(data.password);

    const user = await this.prisma.user.update({
      where: {
        user_id: BigInt(id),
      },
      data: {
        password_hash,
      },
    });

    const {
      password_hash: _,
      refresh_token: __,
      ...safeUser
    } = user;

    return {
      ...safeUser,
      user_id: safeUser.user_id.toString(),
    };
  }

  private async detachInactiveAccount(
    tx: Prisma.TransactionClient,
    userId: bigint,
  ) {
    const openStatuses = [
      ActionStatus.PENDING,
      ActionStatus.APPROVED,
    ];

    const memberships = await tx.organizationMember.findMany({
      where: { user_id: userId },
      select: {
        organization_id: true,
        role: true,
        status: true,
        organization: {
          select: {
            title: true,
            _count: {
              select: {
                members: {
                  where: {
                    user_id: { not: userId },
                    status: MemberStatus.ACTIVE,
                    user: {
                      account_status: AccountStatus.ACTIVE,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const ownerships = memberships.filter(
      (membership) =>
        membership.role === RoleOrg.OWNER &&
        membership.status === MemberStatus.ACTIVE,
    );

    // Vérifier toutes les organisations avant le nettoyage.
    const requiresTransfer = ownerships.find(
      (membership) => membership.organization._count.members > 0,
    );

    if (requiresTransfer) {
      throw new ConflictException(
        `Transfer ownership of "${requiresTransfer.organization.title}" ` +
        'before making this account inactive',
      );
    }

    // Le compte est le seul membre actif de ces organisations.
    const closingOrganizationIds = ownerships.map(
      (membership) => membership.organization_id,
    );

    // Annuler les actions du compte ET celles des organisations fermées.
    const cancelledRows = await tx.action.findMany({
      where: {
        status: { in: openStatuses },
        OR: [
          { creator_id: userId },
          {
            organization_id: {
              in: closingOrganizationIds,
            },
          },
        ],
      },
      select: {
        action_id: true,
        title: true,
        creator_id: true,
        creator: {
          select: {
            account_status: true,
          },
        },
        participation: {
          where: {
            user_id: { not: userId },
            user: {
              account_status: AccountStatus.ACTIVE,
            },
          },
          select: {
            user_id: true,
          },
        },
      },
    });

    const participations = await tx.participation.findMany({
      where: {
        user_id: userId,
        action: {
          status: { in: openStatuses },
        },
      },
      select: {
        action_id: true,
      },
    });

    await tx.participation.deleteMany({
      where: {
        user_id: userId,
        action: {
          status: { in: openStatuses },
        },
      },
    });

    await tx.action.updateMany({
      where: {
        status: { in: openStatuses },
        OR: [
          { creator_id: userId },
          {
            organization_id: {
              in: closingOrganizationIds,
            },
          },
        ],
      },
      data: {
        status: ActionStatus.CANCELLED,
      },
    });

    await tx.organization.updateMany({
      where: {
        organization_id: {
          in: closingOrganizationIds,
        },
      },
      data: {
        organization_status: OrganizationStatus.CLOSED,
      },
    });

    // Retirer toutes ses adhésions et demandes.
    await tx.organizationMember.deleteMany({
      where: {
        user_id: userId,
      },
    });

    const cancelledActions = cancelledRows.map((action) => {
      const recipients = new Set(
        action.participation.map(
          (participant) => participant.user_id,
        ),
      );

      if (
        action.creator_id !== null &&
        action.creator_id !== userId &&
        action.creator?.account_status === AccountStatus.ACTIVE
      ) {
        recipients.add(action.creator_id);
      }

      return {
        action_id: action.action_id,
        title: action.title,
        participation: [...recipients].map(
          (user_id) => ({ user_id }),
        ),
      };
    });

    return {
      cancelledActions,
      actionIds: [
        ...new Set([
          ...cancelledActions.map((action) => action.action_id),
          ...participations.map(
            (participation) => participation.action_id,
          ),
        ]),
      ],
      organizationIds: [
        ...new Set(
          memberships.map(
            (membership) => membership.organization_id,
          ),
        ),
      ],
    };
  }

  //6. desactiver un utilisateur
  async deactivate(id: string) {
    const userId = BigInt(id);
    const affectedOrganizationIds = new Set<bigint>();

    const ownerships = memberships.filter(
      (membership) =>
        membership.role === RoleOrg.OWNER &&
        membership.status === MemberStatus.ACTIVE,
    );

    // Vérifier toutes les organisations avant le nettoyage.
    const requiresTransfer = ownerships.find(
      (membership) => membership.organization._count.members > 0,
    );

    if (requiresTransfer) {
      throw new ConflictException(
        `Transfer ownership of "${requiresTransfer.organization.title}" ` +
        'before making this account inactive',
      );
    }

    // Le compte est le seul membre actif de ces organisations.
    const closingOrganizationIds = ownerships.map(
      (membership) => membership.organization_id,
    );

    // Annuler les actions du compte ET celles des organisations fermées.
    const cancelledRows = await tx.action.findMany({
      where: {
        status: { in: openStatuses },
        OR: [
          { creator_id: userId },
          {
            organization_id: {
              in: closingOrganizationIds,
            },
          },
        ],
      },
      select: {
        action_id: true,
        title: true,
        creator_id: true,
        creator: {
          select: {
            account_status: true,
          },
        },
        participation: {
          where: {
            user_id: { not: userId },
            user: {
              account_status: AccountStatus.ACTIVE,
            },
          },
          select: {
            user_id: true,
          },
        },
      },
    });

    const participations = await tx.participation.findMany({
      where: {
        user_id: userId,
        action: {
          status: { in: openStatuses },
        },
      },
      select: {
        action_id: true,
      },
    });

    await tx.participation.deleteMany({
      where: {
        user_id: userId,
        action: {
          status: { in: openStatuses },
        },
      },
    });

    await tx.action.updateMany({
      where: {
        status: { in: openStatuses },
        OR: [
          { creator_id: userId },
          {
            organization_id: {
              in: closingOrganizationIds,
            },
          },
        ],
      },
      data: {
        status: ActionStatus.CANCELLED,
      },
    });

    await tx.organization.updateMany({
      where: {
        organization_id: {
          in: closingOrganizationIds,
        },
      },
      data: {
        organization_status: OrganizationStatus.CLOSED,
      },
    });

    // Retirer toutes ses adhésions et demandes.
    // Son éventuelle organisation owner est maintenant fermée.
    await tx.organizationMember.deleteMany({
      where: {
        user_id: userId,
      },
    });

    const cancelledActions = cancelledRows.map((action) => {
      const recipients = new Set(
        action.participation.map(
          (participant) => participant.user_id,
        ),
      );

      // Une action de l'organisation peut appartenir à un autre créateur.
      if (
        action.creator_id !== null &&
        action.creator_id !== userId &&
        action.creator?.account_status === AccountStatus.ACTIVE
      ) {
        recipients.add(action.creator_id);
      }

      return {
        action_id: action.action_id,
        title: action.title,
        participation: [...recipients].map(
          (user_id) => ({ user_id }),
        ),
      };
    });

    for (const organizationId of affectedOrganizationIds) {
      this.realtimeGateway.emitOrganizationUpdated(
        organizationId.toString(),
      );
    }

    return {
      cancelledActions,
      actionIds: [
        ...new Set([
          ...cancelledActions.map((action) => action.action_id),
          ...participations.map(
            (participation) => participation.action_id,
          ),
        ]),
      ],
      organizationIds: [
        ...new Set(
          memberships.map(
            (membership) => membership.organization_id,
          ),
        ),
      ],
    };
  }

  private async publishInactiveAccountEffects(effects: {
    actionIds: bigint[];
    organizationIds: bigint[];
    cancelledActions: {
      action_id: bigint;
      title: string;
      participation: {
        user_id: bigint;
      }[];
    }[];
  }) {
    for (const actionId of effects.actionIds) {
      this.realtimeGateway.emitActionUpdated(
        actionId.toString(),
      );
    }

    for (const organizationId of effects.organizationIds) {
      this.realtimeGateway.emitOrganizationUpdated(
        organizationId.toString(),
      );
    }

    await this.realtimeGateway.emitAdminDirectoryChanged('users');
    await this.realtimeGateway.emitAdminDirectoryChanged('actions');
    await this.realtimeGateway.emitAdminDirectoryChanged('organizations');

    for (const action of effects.cancelledActions) {
      for (const participant of action.participation) {
        await this.notificationsService.notifyUser({
          userId: participant.user_id,
          type: NotificationType.ACTION_STATUS_CHANGED,
          title: 'Action cancelled',
          message: `The action "${action.title}" has been cancelled.`,
          link: `/actions/${action.action_id.toString()}`,
        });
      }
    }
  }

  //7. suspendre un utilisateur
  async suspend(targetUserId: string, currentUserId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    if (
      currentUser.role !== RoleApp.ADMIN ||
      currentUser.account_status !== AccountStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'Only an active admin can suspend a user',
      );
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const result = await this.prisma.$transaction(
          async (tx) => {
            const targetUser = await tx.user.findUnique({
              where: {
                user_id: BigInt(targetUserId),
              },
            });

            if (!targetUser) {
              throw new NotFoundException('User to suspend not found');
            }

            if (targetUser.account_status === AccountStatus.SUSPENDED) {
              throw new BadRequestException('User is already suspended');
            }

            if (targetUser.account_status !== AccountStatus.ACTIVE) {
              throw new BadRequestException('Deactivated users cannot be suspended');
            }

            if (targetUser.role === RoleApp.ADMIN) {
              const activeAdminCount = await tx.user.count({
                where: {
                  role: RoleApp.ADMIN,
                  account_status: AccountStatus.ACTIVE,
                },
              });

              if (activeAdminCount <= 1) {
                throw new ConflictException(
                  'The last active admin cannot be suspended',
                );
              }
            }

            const suspendedUser = await tx.user.update({
              where: {
                user_id: BigInt(targetUserId),
              },
              data: {
                account_status: AccountStatus.SUSPENDED,
              },
            });

            await this.pointtransactionService.penalizeSuspendedUser(
              BigInt(targetUserId),
              tx,
            );

            const effects = await this.detachInactiveAccount(
              tx,
              BigInt(targetUserId),
            );

            return {
              user: suspendedUser,
              effects,
            };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        this.realtimeGateway.emitAccountStatusChanged(
          targetUserId,
          'SUSPENDED',
        );

        this.realtimeGateway.emitProfileUpdated(targetUserId);

        await this.publishInactiveAccountEffects(result.effects);

        const {
          password_hash: _,
          refresh_token: __,
          ...safeUser
        } = result.user;

        return {
          ...safeUser,
          user_id: safeUser.user_id.toString(),
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

    throw new BadRequestException('User suspension conflicted with another update');
  }

  //8. Reactiver un utilisateur
  async reactivate(targetUserId: string, currentUserId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    if (
      currentUser.role !== RoleApp.ADMIN ||
      currentUser.account_status !== AccountStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'Only an active admin can reactivate a user',
      );
    }

    const targetUser = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(targetUserId),
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (
      targetUser.account_status !== AccountStatus.SUSPENDED &&
      targetUser.account_status !== AccountStatus.DEACTIVATED
    ) {
      throw new BadRequestException(
        'Only a suspended or deactivated account can be reactivated',
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        user_id: BigInt(targetUserId),
      },
      data: {
        account_status: AccountStatus.ACTIVE,
      },
    });

    this.realtimeGateway.emitAccountStatusChanged(
      targetUserId,
      'ACTIVE',
    );

    this.realtimeGateway.emitProfileUpdated(targetUserId);

    await this.realtimeGateway.emitAdminDirectoryChanged('users');

    const {
      password_hash: _,
      refresh_token: __,
      ...safeUser
    } = updatedUser;

    return {
      ...safeUser,
      user_id: safeUser.user_id.toString(),
    };
  }

  async deleteUser(targetUserId: string, requesterId: string) {
    const targetId = BigInt(targetUserId);
    const adminId = BigInt(requesterId);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const affected = await this.prisma.$transaction(
          async (tx) => {
            const requester = await tx.user.findUnique({
              where: { user_id: adminId },
            });

            if (
              !requester ||
              requester.role !== RoleApp.ADMIN ||
              requester.account_status !== AccountStatus.ACTIVE
            ) {
              throw new ForbiddenException(
                'Only an active admin can delete a user',
              );
            }

            if (targetId === adminId) {
              throw new BadRequestException(
                'You cannot delete your own account from the admin panel',
              );
            }

            const target = await tx.user.findUnique({
              where: { user_id: targetId },
            });

            if (!target) {
              throw new NotFoundException('User not found');
            }

            if (
              target.role === RoleApp.ADMIN &&
              target.account_status === AccountStatus.ACTIVE
            ) {
              const activeAdmins = await tx.user.count({
                where: {
                  role: RoleApp.ADMIN,
                  account_status: AccountStatus.ACTIVE,
                },
              });

              if (activeAdmins <= 1) {
                throw new ConflictException(
                  'The last active admin cannot be deleted',
                );
              }
            }

            const ownership = await tx.organizationMember.findFirst({
              where: {
                user_id: targetId,
                role: RoleOrg.OWNER,
                status: MemberStatus.ACTIVE,
              },
            });

            if (ownership) {
              throw new ConflictException(
                'Transfer organization ownership before deleting this account',
              );
            }
            // Récupérer les contenus concernés avant de supprimer leurs relations.
            const [actions, organizations] = await Promise.all([
              tx.action.findMany({
                where: {
                  OR: [
                    { creator_id: targetId },
                    { validated_by_user_id: targetId },
                    { participation: { some: { user_id: targetId } } },
                    { comments: { some: { user_id: targetId } } },
                  ],
                },
                select: { action_id: true },
              }),
              tx.organization.findMany({
                where: {
                  OR: [
                    { creator_id: targetId },
                    { members: { some: { user_id: targetId } } },
                    { comments: { some: { user_id: targetId } } },
                  ],
                },
                select: { organization_id: true },
              }),
            ]);
            const cancelledActions = await tx.action.findMany({
              where: {
                creator_id: targetId,
                status: {
                  in: [ActionStatus.PENDING, ActionStatus.APPROVED],
                },
              },
              select: {
                action_id: true,
                title: true,
                participation: {
                  where: {
                    user_id: { not: targetId },
                  },
                  select: {
                    user_id: true,
                  },
                },
              },
            });

            await tx.action.updateMany({
              where: {
                creator_id: targetId,
                status: {
                  in: [ActionStatus.PENDING, ActionStatus.APPROVED],
                },
              },
              data: {
                status: ActionStatus.CANCELLED,
              },
            });
            await tx.friendRequest.deleteMany({
              where: {
                OR: [
                  { requester_id: targetId },
                  { addressee_id: targetId },
                ],
              },
            });

            await tx.friendship.deleteMany({
              where: {
                OR: [
                  { user1_id: targetId },
                  { user2_id: targetId },
                ],
              },
            });

            // Nettoyer aussi une éventuelle référence de blocage restante.
            await tx.friendship.updateMany({
              where: { blocked_by_user_id: targetId },
              data: { blocked_by_user_id: null },
            });

            await tx.participation.deleteMany({
              where: { user_id: targetId },
            });

            await tx.organizationMember.deleteMany({
              where: { user_id: targetId },
            });

            await tx.pointTransaction.deleteMany({
              where: { user_id: targetId },
            });

            // Les relations Cascade suppriment notamment le profil,
            // les sessions, messages, intérêts et notifications.
            // Les relations SetNull conservent les contenus.
            await tx.user.delete({
              where: { user_id: targetId },
            });
            return { actions, organizations, cancelledActions };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        this.realtimeGateway.emitAccountDeleted(targetUserId);
        this.realtimeGateway.emitProfileUpdated(targetUserId);

        for (const { action_id } of affected.actions) {
          const actionId = action_id.toString();

          this.realtimeGateway.emitActionUpdated(actionId);
          this.realtimeGateway.emitActionCommentsChanged(actionId);
        }

        for (const { organization_id } of affected.organizations) {
          const organizationId = organization_id.toString();

          this.realtimeGateway.emitOrganizationUpdated(organizationId);
          this.realtimeGateway.emitOrganizationCommentsChanged(organizationId);
        }
        for (const action of affected.cancelledActions) {
          for (const participant of action.participation) {
            await this.notificationsService.notifyUser({
              userId: participant.user_id,
              type: NotificationType.ACTION_STATUS_CHANGED,
              title: 'Action cancelled',
              message:
                `The action "${action.title}" was cancelled ` +
                `because its creator's account was deleted.`,
              link: `/actions/${action.action_id.toString()}`,
            });
          }
        }
        return { deleted: true, user_id: targetUserId };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034'
        ) {
          if (attempt < 2) continue;

          throw new ConflictException(
            'Another update conflicted with the deletion. Please try again.',
          );
        }

        throw error;
      }
    }
  }

  async updateRole(
    targetUserId: string,
    requesterId: string,
    role: 'USER' | 'ADMIN',
  ) {
    const targetId = BigInt(targetUserId);
    const adminId = BigInt(requesterId);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await this.prisma.$transaction(
          async (tx) => {
            const requester = await tx.user.findUnique({
              where: { user_id: adminId },
            });

            if (
              !requester ||
              requester.role !== RoleApp.ADMIN ||
              requester.account_status !== AccountStatus.ACTIVE
            ) {
              throw new ForbiddenException(
                'Only an active admin can change user roles',
              );
            }

            const target = await tx.user.findUnique({
              where: { user_id: targetId },
            });

            if (!target) {
              throw new NotFoundException('User not found');
            }

            if (
              role === RoleApp.ADMIN &&
              target.account_status !== AccountStatus.ACTIVE
            ) {
              throw new BadRequestException(
                'Only an active account can be promoted to admin',
              );
            }

            if (target.role === role) return;

            if (
              target.role === RoleApp.ADMIN &&
              target.account_status === AccountStatus.ACTIVE &&
              role === RoleApp.USER
            ) {
              const activeAdmins = await tx.user.count({
                where: {
                  role: RoleApp.ADMIN,
                  account_status: AccountStatus.ACTIVE,
                },
              });

              if (activeAdmins <= 1) {
                throw new ConflictException(
                  'The last active admin cannot be demoted',
                );
              }
            }

            await tx.user.update({
              where: { user_id: targetId },
              data: { role },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034'
        ) {
          if (attempt < 2) continue;

          throw new ConflictException(
            'Another update conflicted with the role change. Please try again.',
          );
        }

        throw error;
      }

      this.realtimeGateway.emitAccountRoleChanged(
        targetUserId,
        role,
      );

      await this.realtimeGateway.emitAdminDirectoryChanged('users');

      return this.findOneSafe(targetUserId);
    }
  }

  async createByAdmin(requesterId: string, data: CreateUserDto) {
    const requester = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(requesterId),
      },
    });

    if (
      !requester ||
      requester.role !== RoleApp.ADMIN ||
      requester.account_status !== AccountStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'Only an active admin can create a user',
      );
    }

    try {
      const user = await this.create(data);

      return {
        success: true as const,
        user,
      };
    } catch (error) {
      const emailAlreadyUsed =
        (
          error instanceof BadRequestException &&
          error.message === 'Email is already used'
        ) ||
        (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        );

      if (emailAlreadyUsed) {
        return {
          success: false as const,
          reason: 'EMAIL_TAKEN' as const,
        };
      }

      throw error;
    }
  }

  async findOneForViewer(
    targetUserId: string,
    requesterId: string,
  ) {
    const requester = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(requesterId),
      },
    });

    if (
      !requester ||
      requester.account_status !== AccountStatus.ACTIVE
    ) {
      throw new ForbiddenException('Your account is not active');
    }

    const isSelf = BigInt(targetUserId) === requester.user_id;
    const isAdmin = requester.role === RoleApp.ADMIN;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException(
        'You cannot view another user account',
      );
    }

    return this.findOneSafe(targetUserId);
  }
}