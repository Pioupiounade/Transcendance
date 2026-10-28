import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileVisibility, AccountStatus, FriendshipStatus, RoleApp } from '../../generated/prisma/client';
import { findCommune } from './find-commune';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class ProfilesService {

  constructor(
    private prisma: PrismaService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  //Trouver tous les profils publics des utilisateurs actifs
  async findAll() {
    const profiles = await this.prisma.profile.findMany({
      where: {
        visibility: ProfileVisibility.PUBLIC,
        user: {
          account_status: AccountStatus.ACTIVE,
        },
      },
    });

    return profiles.map(({ location, ...profile }) => ({ //retirer location de la reponse retournee par la fonction
      ...profile,
      user_id: profile.user_id.toString(),
    }));
  }

  //Trouver un profil specifique avec l'user_id
  async findOne(userId: string, viewerId?: string) {
    if (!/^\d+$/.test(userId)) {
      return {
        available: false as const,
        reason: 'PROFILE_UNAVAILABLE' as const,
        user_id: userId,
      };
    }

    const profile = await this.prisma.profile.findUnique({
      where: {
        user_id: BigInt(userId),
      },
      include: {
        user: {
          select: {
            account_status: true,
            last_seen_at: true,
            interests: {
              select: { interest: true },
            },
          },
        },
      },
    });

    if (!profile) {
      return {
        available: false as const,
        reason: 'PROFILE_UNAVAILABLE' as const,
        user_id: userId,
      };
    }

    if (profile.user.account_status === AccountStatus.DEACTIVATED) {
      return {
        available: false as const,
        reason: 'ACCOUNT_DEACTIVATED' as const,
        user_id: profile.user_id.toString(),
      };
    }

    if (profile.user.account_status === AccountStatus.SUSPENDED) {
      return {
        available: false as const,
        reason: 'ACCOUNT_SUSPENDED' as const,
        user_id: profile.user_id.toString(),
      };
    }

    const isOwner = profile.user_id.toString() === viewerId;

    if (profile.visibility === ProfileVisibility.PRIVATE && !isOwner) {
      return {
        user_id: profile.user_id.toString(),
        username: profile.username,
        profile_picture: profile.profile_picture ?? null,
        visibility: ProfileVisibility.PRIVATE,
        isPrivate: true,
      };
    }

    if (profile.visibility === ProfileVisibility.FRIENDS_ONLY) {
      if (!viewerId) {
        return {
          user_id: profile.user_id.toString(),
          username: profile.username,
          profile_picture: profile.profile_picture ?? null,
          visibility: ProfileVisibility.FRIENDS_ONLY,
          isPrivate: true,
        };
      }

      const visitorId = BigInt(viewerId);
      if (visitorId === profile.user_id) {

      } else {
        const visitor = await this.prisma.user.findUnique({
          where: { user_id: visitorId },
          select: { account_status: true },
        });

        if (!visitor || visitor.account_status !== AccountStatus.ACTIVE) {
          throw new NotFoundException('Profile not found');
        }

        const friendship = await this.prisma.friendship.findFirst({
          where: {
            status: FriendshipStatus.ACTIVE,
            OR: [
              { user1_id: visitorId, user2_id: profile.user_id },
              { user1_id: profile.user_id, user2_id: visitorId },
            ],
          },
        });

        if (!friendship) {
          return {
            user_id: profile.user_id.toString(),
            username: profile.username,
            profile_picture: profile.profile_picture ?? null,
            visibility: ProfileVisibility.FRIENDS_ONLY,
            isPrivate: true,
          };
        }
      }
    }
        const { location, user, ...safeProfile } = profile;

    let canSeePresence = isOwner;

    if (!isOwner && viewerId) {
      const visitorId = BigInt(viewerId);

      const friendship = await this.prisma.friendship.findFirst({
        where: {
          status: FriendshipStatus.ACTIVE,
          blocked_by_user_id: null,
          OR: [
            {
              user1_id: visitorId,
              user2_id: profile.user_id,
            },
            {
              user1_id: profile.user_id,
              user2_id: visitorId,
            },
          ],
        },
        select: {
          user1_id: true,
        },
      });

      canSeePresence = Boolean(friendship);
    }

      const isOnline = canSeePresence 
        ? this.realtimeGateway.isUserOnline(userId)
        : undefined;

    return {
      ...safeProfile,
      user_id: safeProfile.user_id.toString(),
      interests: user.interests.map(({ interest }) => interest),
      is_online: isOnline,
    };
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    const existingProfile = await this.prisma.profile.findUnique({
      where: { username },
      select: { user_id: true },
    });

    return existingProfile !== null;
  }

  //Trouver un profil specifique avec le username
  async findByUsername(query: string, viewerId: string) {
    const viewerUserId = BigInt(viewerId);

    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACTIVE,
        OR: [
          { user1_id: viewerUserId },
          { user2_id: viewerUserId },
        ],
      },
      select: {
        user1_id: true,
        user2_id: true,
      },
    });

    const friendIds = friendships.map((friendship) =>
      friendship.user1_id === viewerUserId
        ? friendship.user2_id
        : friendship.user1_id,
    );

    const profiles = await this.prisma.profile.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive',
        },
        user: {
          account_status: AccountStatus.ACTIVE,
        },
        OR: [
          {
            visibility: ProfileVisibility.PUBLIC,
          },
          {
            visibility: ProfileVisibility.FRIENDS_ONLY,
            user_id: {
              in: friendIds,
            },
          },
        ],
      },
      take: 15,
    });

    return profiles.map(({ location, ...profile }) => ({
      ...profile,
      user_id: profile.user_id.toString(),
    }));
  }

  //Creer un nouveau profil
  async create(currentUserId: string, data: CreateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Only an active user can create a profile');
    }

    const existingProfile = await this.prisma.profile.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (existingProfile) {
      throw new BadRequestException('User already has a profile');
    }

    const existingUsername = await this.prisma.profile.findUnique({
      where: {
        username: data.username,
      },
    });

    if (existingUsername) {
      throw new BadRequestException(
        'Username is already taken',
      );
    }

    const commune = await findCommune(data.location);

    const createdProfile = await this.prisma.profile.create({
      data: {
        user_id: BigInt(currentUserId),
        username: data.username,
        description: data.description,
        profile_picture: data.profile_picture,
        location: data.location,
        commune,
        visibility: data.visibility,
      },
    });

    const { location, ...safeProfile } = createdProfile;

    return {
      ...safeProfile,
      user_id: safeProfile.user_id.toString(),
    };
  }

  //Mettre a jour un profil
  async updateProfile(
    currentUserId: string,
    data: UpdateProfileDto,
    targetUserId: string = currentUserId,
  ) {
    const requester = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!requester) {
      throw new NotFoundException('User not found');
    }

    if (requester.account_status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException('Your account is not active');
    }

    if (
      currentUserId !== targetUserId &&
      requester.role !== RoleApp.ADMIN
    ) {
      throw new ForbiddenException(
        'Only an admin can edit another user profile',
      );
    }

    const existingProfile = await this.prisma.profile.findUnique({
      where: {
        user_id: BigInt(targetUserId),
      },
    });

    if (!existingProfile) {
      throw new NotFoundException('Profile does not exist');
    }

    if (data.username) {
      const existingUsername = await this.prisma.profile.findUnique({
        where: {
          username: data.username,
        },
      });

      if (
        existingUsername &&
        existingUsername.user_id !== BigInt(targetUserId)
      ) {
        throw new BadRequestException(
          'Username is already taken',
        );
      }
    }

    const communeUpdate =
      data.location !== undefined
        ? { commune: await findCommune(data.location) }
        : {};

    const updatedProfile = await this.prisma.profile.update({
      where: {
        user_id: BigInt(targetUserId),
      },
      data: {
        username: data.username,
        description: data.description,
        profile_picture: data.profile_picture,
        location: data.location,
        visibility: data.visibility,
        ...communeUpdate,
      },
    });

    this.realtimeGateway.emitProfileUpdated(targetUserId);

    const { location, ...safeProfile } = updatedProfile;

    return {
      ...safeProfile,
      user_id: safeProfile.user_id.toString(),
    };
  }

  //Trouver son propre profil specifique
  async findOwnProfile(currentUserId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!profile) {
      return null;
    }

    return {
      ...profile,
      user_id: profile.user_id.toString(),
    };
  }

  async findProfileForAdmin(requesterId: string, targetUserId: string) {
    const requester = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(requesterId),
      },
    });

    if (
      !requester ||
      requester.account_status !== AccountStatus.ACTIVE ||
      requester.role !== RoleApp.ADMIN
    ) {
      throw new ForbiddenException('An active admin account is required');
    }

    const profile = await this.prisma.profile.findUnique({
      where: {
        user_id: BigInt(targetUserId),
      },
    });

    if (!profile) {
      return null;
    }

    return {
      ...profile,
      user_id: profile.user_id.toString(),
    };
  }
}
