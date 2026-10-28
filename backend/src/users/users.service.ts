import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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
} from '../../generated/prisma/client';
import { PointtransactionService } from '../pointtransaction/pointtransaction.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class UsersService {
// UsersService recoit PrismaService par injection. 
  constructor(
    private prisma: PrismaService,
    private pointtransactionService: PointtransactionService,
    private realtimeGateway: RealtimeGateway,
  ) {}

// Utllise this.prisma pour recuperer les Users dans PostgreSQL. Cette methode metier accede reellement a la BDD via Prisma
//1. recuperer tous les utilisateurs
  async findAll() {
    const users = await this.prisma.user.findMany();

  return users.map(({ password_hash, refresh_token, ...user }) => ({
    ...user,
    user_id: user.user_id.toString(),
  }));
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

//6. desactiver un utilisateur
  async deactivate(id: string) {
    const userId = BigInt(id);
    const affectedOrganizationIds = new Set<bigint>();

    const user = await this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { user_id: userId },
      });

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      const ownedActiveOrganization = await tx.organizationMember.findFirst({
        where: {
          user_id: userId,
          role: RoleOrg.OWNER,
          status: MemberStatus.ACTIVE,
          organization: {
            organization_status: OrganizationStatus.ACTIVE,
          },
        },
      });

      if (ownedActiveOrganization) {
        throw new BadRequestException(
          'Transfer organization ownership before deactivating your account',
        );
      }

      const memberships = await tx.organizationMember.findMany({
        where: { user_id: userId },
        select: { organization_id: true },
      });

      for (const membership of memberships) {
        affectedOrganizationIds.add(membership.organization_id);
      }

      await tx.organizationMember.deleteMany({
        where: {
          user_id: userId,
          status: MemberStatus.ACTIVE,
          role: {
            in: [RoleOrg.MEMBER, RoleOrg.MANAGER],
          },
        },
      });
      // 1. Retirer l'utilisateur des actions encore ouvertes
      await tx.participation.deleteMany({
        where: {
          user_id: userId,
          action: {
            status: {
              in: [
                ActionStatus.PENDING,
                ActionStatus.APPROVED,
              ],
            },
          },
        },
      });

      // 2. Annuler les actions encore ouvertes qu'il a créées
      await tx.action.updateMany({
        where: {
          creator_id: userId,
          status: {
            in: [
              ActionStatus.PENDING,
              ActionStatus.APPROVED,
            ],
          },
        },
        data: {
          status: ActionStatus.CANCELLED,
        },
      });

      // 3. Désactiver le compte
      return tx.user.update({
        where: {
          user_id: userId,
        },
        data: {
          account_status: AccountStatus.DEACTIVATED,
          refresh_token: null,
        },
      });
    });

    for (const organizationId of affectedOrganizationIds) {
      this.realtimeGateway.emitOrganizationUpdated(
        organizationId.toString(),
      );
    }
  
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

    if (currentUser.role !== RoleApp.ADMIN) {
      throw new ForbiddenException('Only an admin can suspend a user');
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const updatedUser = await this.prisma.$transaction(
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

            return suspendedUser;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        this.realtimeGateway.emitAccountStatusChanged(
          targetUserId,
          'SUSPENDED',
        );

        const {
          password_hash: _,
          refresh_token: __,
          ...safeUser
        } = updatedUser;

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

    if (currentUser.role !== RoleApp.ADMIN) {
      throw new ForbiddenException('Only an admin can reactivate a user');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(targetUserId),
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (targetUser.account_status !== AccountStatus.SUSPENDED) {
      throw new BadRequestException('Only a suspended account can be reactivated');
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
}