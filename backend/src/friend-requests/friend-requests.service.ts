import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { FriendRequestStatus, FriendshipStatus, AccountStatus, Prisma, NotificationType } from '../../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FriendRequestsService {
    constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    ) {}

private async getActiveUser(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: {
      user_id: BigInt(userId),
    },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (user.account_status !== AccountStatus.ACTIVE) {
    throw new BadRequestException('User is not active');
  }

  return user;
}

//Envoyer une demande d'ami
    async sendFriendRequest(currentUserId: string, data: SendFriendRequestDto) {
    const currentUserIdBigInt = BigInt(currentUserId);
    const receiverId = BigInt(data.addressee_id);

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
        const sentRequest = await this.prisma.$transaction(
            async (tx) => {
            const user = await tx.user.findUnique({
                where: {
                user_id: currentUserIdBigInt,
                },
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            if (user.account_status !== AccountStatus.ACTIVE) {
                throw new BadRequestException('User is not active');
            }

            const receiver = await tx.user.findUnique({
                where: {
                user_id: receiverId,
                },
            });

            if (!receiver) {
                throw new NotFoundException('Receiver not found');
            }

            if (receiver.account_status !== AccountStatus.ACTIVE) {
                throw new BadRequestException('Friend requests can only be sent to active users');
            }

            if (user.user_id === receiver.user_id) {
                throw new BadRequestException('You can\'t send a request to yourself');
            }

            const existingPendingRequest =
                await tx.friendRequest.findFirst({
                where: {
                    status: FriendRequestStatus.PENDING,
                    OR: [
                    {
                        requester_id: user.user_id,
                        addressee_id: receiver.user_id,
                    },
                    {
                        requester_id: receiver.user_id,
                        addressee_id: user.user_id,
                    },
                    ],
                },
                });

            if (existingPendingRequest) {
                throw new BadRequestException('A pending friend request already exists between these users');
            }

            const existingFriendship =
                await tx.friendship.findFirst({
                where: {
                    status: {
                    in: [
                        FriendshipStatus.ACTIVE,
                        FriendshipStatus.BLOCKED,
                    ],
                    },
                    OR: [
                    {
                        user1_id: user.user_id,
                        user2_id: receiver.user_id,
                    },
                    {
                        user1_id: receiver.user_id,
                        user2_id: user.user_id,
                    },
                    ],
                },
                });

            if (
                existingFriendship?.status ===
                FriendshipStatus.ACTIVE
            ) {
                throw new BadRequestException('Friendship already active');
            }

            if (
                existingFriendship?.status ===
                FriendshipStatus.BLOCKED
            ) {
                throw new BadRequestException('Friendship blocked');
            }

            return tx.friendRequest.create({
                data: {
                requester_id: user.user_id,
                addressee_id: receiver.user_id,
                },
            });
            },
            {
            isolationLevel:
                Prisma.TransactionIsolationLevel.Serializable,
            },
        );

        await this.notificationsService.notifyUser({
           userId: sentRequest.addressee_id,
           type: NotificationType.FRIEND_REQUEST,
           title: 'New friend request',
           message: 'You received a new friend request.',
        });

        return {
            ...sentRequest,
            friend_request_id:
            sentRequest.friend_request_id.toString(),
            requester_id:
            sentRequest.requester_id.toString(),
            addressee_id:
            sentRequest.addressee_id.toString(),
        };
        } catch (error) {
        if (
            error instanceof
            Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2034' &&
            attempt < 2
        ) {
            continue;
        }

        throw error;
        }
    }

    throw new BadRequestException('Friend request could not be created, please try again');
    }

//Accepter la demande d'ami
async acceptFriendRequest(currentUserId: string, requestId: string) {
    const user = await this.getActiveUser(currentUserId);

    const request = await this.prisma.friendRequest.findUnique({
        where: {
        friend_request_id: BigInt(requestId),
        },
    });

    if (!request) {
        throw new NotFoundException('Friend request not found');
    }

    if (request.status !== FriendRequestStatus.PENDING) {
        throw new BadRequestException('This friend request can no longer be accepted');
    }

    if (request.addressee_id !== user.user_id) {
        throw new ForbiddenException('Only the receiver can accept this friend request');
    }

    const requester = await this.prisma.user.findUnique({
        where: {
            user_id: request.requester_id,
        },
        });

    if (!requester) {
        throw new NotFoundException('Requester not found');
    }

    if (requester.account_status !== AccountStatus.ACTIVE) {
        throw new BadRequestException('Friend request requester is no longer active');
    }

    let updatedRequest;

    try {
    updatedRequest = await this.prisma.$transaction(
        async (tx) => {
        const updateResult = await tx.friendRequest.updateMany({
            where: {
            friend_request_id: BigInt(requestId),
            status: FriendRequestStatus.PENDING,
            },
            data: {
            status: FriendRequestStatus.ACCEPTED,
            responded_at: new Date(),
            },
        });

        if (updateResult.count !== 1) {
            throw new BadRequestException('This friend request can no longer be accepted');
        }

        const user1Id =
            request.requester_id < request.addressee_id
            ? request.requester_id
            : request.addressee_id;

        const user2Id =
            request.requester_id < request.addressee_id
            ? request.addressee_id
            : request.requester_id;

        await tx.friendship.create({
            data: {
            user1_id: user1Id,
            user2_id: user2Id,
            status: FriendshipStatus.ACTIVE,
            },
        });

        return tx.friendRequest.findUniqueOrThrow({
            where: {
            friend_request_id: BigInt(requestId),
            },
        });
        },
    );
    } catch (error) {
    if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
    ) {
        throw new BadRequestException('Friendship already exists between these users');
    }

    throw error;
    }
    return {
    ...updatedRequest,
    friend_request_id: updatedRequest.friend_request_id.toString(),
    requester_id: updatedRequest.requester_id.toString(),
    addressee_id: updatedRequest.addressee_id.toString(),
    };
}

//rejeter la demande d'ami
async rejectFriendRequest(currentUserId: string, requestId: string) {
    const user = await this.getActiveUser(currentUserId);

    const request = await this.prisma.friendRequest.findUnique({
        where: {
        friend_request_id: BigInt(requestId),
        },
    });

    if (!request) {
        throw new NotFoundException('Friend request not found');
    }

    if (request.status !== FriendRequestStatus.PENDING) {
        throw new BadRequestException('This friend request can no longer be rejected');
    }

    if (request.addressee_id !== user.user_id) {
        throw new ForbiddenException('Only the receiver can reject this friend request');
    }

    const updatedRequest = await this.prisma.friendRequest.update({
        where: {
        friend_request_id: BigInt(requestId),
        },
        data: {
        status: FriendRequestStatus.REJECTED,
        responded_at: new Date(),
        },
    });

    return {
        ...updatedRequest,
        friend_request_id: updatedRequest.friend_request_id.toString(),
        requester_id: updatedRequest.requester_id.toString(),
        addressee_id: updatedRequest.addressee_id.toString(),
    };
}

// Annuler une demande d'ami envoyée
async cancelFriendRequest(currentUserId: string, requestId: string) {
  const user = await this.getActiveUser(currentUserId);

  const request = await this.prisma.friendRequest.findUnique({
    where: {
      friend_request_id: BigInt(requestId),
    },
  });

  if (!request) {
    throw new NotFoundException('Friend request not found');
  }

  if (request.status !== FriendRequestStatus.PENDING) {
    throw new BadRequestException(
      'This friend request can no longer be cancelled',
    );
  }

  if (request.requester_id !== user.user_id) {
    throw new ForbiddenException(
      'Only the sender can cancel this friend request',
    );
  }

  await this.prisma.friendRequest.delete({
    where: {
      friend_request_id: BigInt(requestId),
    },
  });

  return { success: true };
}

//Voir mes demandes d'ami envoyees
async mySentRequests(currentUserId: string) {
    const user = await this.getActiveUser(currentUserId);

    const mySentRequests = await this.prisma.friendRequest.findMany({
    where: {
        requester_id: user.user_id,
        status: FriendRequestStatus.PENDING,
    },
    include: {
        addressee: {
        select: {
            user_id: true,

            profile: {
            select: {
                username: true,
                profile_picture: true,
            },
            },
        },
        }
    },
    });

    return mySentRequests.map((request) => ({
    friend_request_id: request.friend_request_id.toString(),
    status: request.status,
    created_at: request.created_at,
    addressee: {
        user_id: request.addressee.user_id.toString(),
        username: request.addressee.profile?.username ?? null,
        profile_picture: request.addressee.profile?.profile_picture ?? null,
    },
    }));
}

//Voir mes demandes d'ami recues en attente
async myReceivedRequests(currentUserId: string) {
    const user = await this.getActiveUser(currentUserId);

    const myReceivedRequests = await this.prisma.friendRequest.findMany({
    where: {
        addressee_id: user.user_id,
        status: FriendRequestStatus.PENDING,
    },
    include: {
        requester: {
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

    return myReceivedRequests.map((request) => ({
    friend_request_id: request.friend_request_id.toString(),
    status: request.status,
    created_at: request.created_at,
    requester: {
        user_id: request.requester.user_id.toString(),
        username: request.requester.profile?.username ?? null,
        profile_picture: request.requester.profile?.profile_picture ?? null,
    },
    }));
}

}
