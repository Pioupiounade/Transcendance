import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendshipStatus, AccountStatus } from '../../generated/prisma/client';

@Injectable()
export class FriendshipsService {
    constructor(private prisma: PrismaService) {}

// Voir tous mes amis actifs
async findMyFriends(currentUserId: string) {
  const userId = BigInt(currentUserId);

  const friendships = await this.prisma.friendship.findMany({
    where: {
      status: FriendshipStatus.ACTIVE,
      OR: [
        {
          user1_id: userId,
        },
        {
          user2_id: userId,
        },
      ],
    },
    include: {
      user1: {
        include: {
          profile: true,
        },
      },
      user2: {
        include: {
          profile: true,
        },
      },
    },
  });

  return friendships.map((friendship) => {
    const friend =
      friendship.user1_id === userId
        ? friendship.user2
        : friendship.user1;

    return {
      user_id: friend.user_id.toString(),
      username: friend.profile?.username ?? null,
      profile_picture: friend.profile?.profile_picture ?? null,
      status: friendship.status,
      created_at: friendship.created_at,
    };
  });
}

// Voir tous mes amis bloqués
async findBlockedFriends(currentUserId: string) {
  const userId = BigInt(currentUserId);

  const friendships = await this.prisma.friendship.findMany({
    where: {
      status: FriendshipStatus.BLOCKED,
    blocked_by_user_id: userId,
      OR: [
        {
          user1_id: userId,
        },
        {
          user2_id: userId,
        },
      ],
    },
    include: {
      user1: {
        include: {
          profile: true,
        },
      },
      user2: {
        include: {
          profile: true,
        },
      },
    },
  });

  return friendships.map((friendship) => {
    const friend =
      friendship.user1_id === userId ? friendship.user2 : friendship.user1;

      return {
      user_id: friend.user_id.toString(),
      username: friend.profile?.username ?? null,
      profile_picture: friend.profile?.profile_picture ?? null,
      status: friendship.status,
      created_at: friendship.created_at,
    };
  });
}

// Bloquer un ami
async blockFriend( currentUserId: string, friendUserId: string) {
    const user = await this.prisma.user.findUnique({
        where: {
            user_id: BigInt(currentUserId),
        },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Only an active user can block another user');
    }

    const friendship = await this.prisma.friendship.findFirst({
    where: {
        OR: [
        {
            user1_id: BigInt(currentUserId),
            user2_id: BigInt(friendUserId),
        },
        {
            user1_id: BigInt(friendUserId),
            user2_id: BigInt(currentUserId),
        },
        ],
    },
    });

    if (!friendship) {
        throw new NotFoundException('Friendship not found');
    }

    if (friendship.status !== FriendshipStatus.ACTIVE) {
    throw new BadRequestException(
        'Only an active friendship can be blocked',
    );
    }

    const blockedFriendship = await this.prisma.friendship.update({
    where: {
        user1_id_user2_id: {
        user1_id: friendship.user1_id,
        user2_id: friendship.user2_id,
        },
    },
    data: {
        status: FriendshipStatus.BLOCKED,
        blocked_by_user_id: user.user_id,
    },
    });

    return {
        ...blockedFriendship,
        user1_id: blockedFriendship.user1_id.toString(),
        user2_id: blockedFriendship.user2_id.toString(),
        blocked_by_user_id:
        blockedFriendship.blocked_by_user_id?.toString() ?? null,
    };
}

// Débloquer un ami
async unblockFriend(currentUserId: string, friendUserId: string) {
    const user = await this.prisma.user.findUnique({
        where: {
            user_id: BigInt(currentUserId),
        },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Only an active user can unblock another user');
    }

    const friendship = await this.prisma.friendship.findFirst({
    where: {
        OR: [
        {
            user1_id: BigInt(currentUserId),
            user2_id: BigInt(friendUserId),
        },
        {
            user1_id: BigInt(friendUserId),
            user2_id: BigInt(currentUserId),
        },
        ],
    },
    });

    if (!friendship) {
        throw new NotFoundException('Friendship not found');
    }

    if (friendship.status !== FriendshipStatus.BLOCKED) {
    throw new BadRequestException(  'This friendship is not blocked');
    }

    if (friendship.blocked_by_user_id !== user.user_id) {
    throw new ForbiddenException('Only the user who blocked this friendship can unblock it');
    }


    const unblockedFriendship = await this.prisma.friendship.update({
    where: {
        user1_id_user2_id: {
        user1_id: friendship.user1_id,
        user2_id: friendship.user2_id,
        },
    },
    data: {
        status: FriendshipStatus.ACTIVE,
        blocked_by_user_id: null,
    },
    });

    return {
        ...unblockedFriendship,
        user1_id: unblockedFriendship.user1_id.toString(),
        user2_id: unblockedFriendship.user2_id.toString(),
        blocked_by_user_id:
            unblockedFriendship.blocked_by_user_id?.toString() ?? null,
    };
}

// Supprimer une amitié
async removeFriend(currentUserId: string, friendUserId: string){
    const user = await this.prisma.user.findUnique({
        where: {
            user_id: BigInt(currentUserId),
        },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Only an active user can remove another user');
    }

    const friendship = await this.prisma.friendship.findFirst({
    where: {
        OR: [
        {
            user1_id: BigInt(currentUserId),
            user2_id: BigInt(friendUserId),
        },
        {
            user1_id: BigInt(friendUserId),
            user2_id: BigInt(currentUserId),
        },
        ],
    },
    });

    if (!friendship) {
        throw new NotFoundException('Friendship not found');
    }

    if (friendship.status !== FriendshipStatus.ACTIVE) {
        throw new BadRequestException('This friendship is not active');
    }

    const removedFriendship = await this.prisma.friendship.delete({
    where: {
        user1_id_user2_id: {
        user1_id: friendship.user1_id,
        user2_id: friendship.user2_id,
        },
    },
    });

    return {
        ...removedFriendship,
        user1_id: removedFriendship.user1_id.toString(),
        user2_id: removedFriendship.user2_id.toString(),
        blocked_by_user_id:
            removedFriendship.blocked_by_user_id?.toString() ?? null,
    };
}
}
