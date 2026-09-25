import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileVisibility, AccountStatus, FriendshipStatus } from '../../generated/prisma/client';
import { findCommune } from './find-commune';

@Injectable()
export class ProfilesService {

    constructor(private prisma: PrismaService) {}

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
      throw new NotFoundException('Profile not found');
    }

    const profile = await this.prisma.profile.findUnique({
      where: {
        user_id: BigInt(userId),
      },
      include: {
        user: {
          select: {
            account_status: true,
            interests: {
              select: { interest: true },
            },
          },
        },
      },
    });

    if (
      !profile ||
      profile.user.account_status !== AccountStatus.ACTIVE ||
      profile.visibility === ProfileVisibility.PRIVATE
    ) {
      throw new NotFoundException('Profile not found');
    }

    if (profile.visibility === ProfileVisibility.FRIENDS_ONLY) {
      if (!viewerId) {
        throw new NotFoundException('Profile not found');
      }

      const visitorId = BigInt(viewerId);

      const visitor = await this.prisma.user.findUnique({
        where: { user_id: visitorId },
        select: { account_status: true },
      });

      if (visitor?.account_status !== AccountStatus.ACTIVE) {
        throw new NotFoundException('Profile not found');
      }

      if (visitorId !== profile.user_id) {
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
          throw new NotFoundException('Profile not found');
        }
      }
    }

    const { location, user, ...safeProfile } = profile;

    return {
      ...safeProfile,
      user_id: safeProfile.user_id.toString(),
      interests: user.interests.map(({ interest }) => interest),
    };
  }

//Trouver un profil specifique avec le username
 async findByUsername(query: string) {
  const profiles = await this.prisma.profile.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive',
        },
        visibility: ProfileVisibility.PUBLIC,
        user: {
            account_status: AccountStatus.ACTIVE,
        },
      },
      take: 15,
    });

  return profiles.map(({ location, ...profile }) => ({ //retirer location de la reponse retournee par la fonction
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
async updateProfile(currentUserId: string, data: UpdateProfileDto) {
  const user = await this.prisma.user.findUnique({
    where: {
      user_id: BigInt(currentUserId),
    },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (user.account_status !== AccountStatus.ACTIVE) {
    throw new BadRequestException('Only an active user can change a profile');
  }

  const existingProfile = await this.prisma.profile.findUnique({
    where: {
      user_id: BigInt(currentUserId),
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
      existingUsername.user_id !== BigInt(currentUserId)
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
      user_id: BigInt(currentUserId),
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
    throw new NotFoundException('Profile not found');
  }

  return {
    ...profile,
    user_id: profile.user_id.toString(),
  };
}
}
