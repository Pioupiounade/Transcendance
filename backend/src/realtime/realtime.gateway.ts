import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})

export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  isUserOnline(userId: string): boolean {
    const room = `user:${userId}`;
    return (this.server.sockets.adapter.rooms.get(room)?.size ?? 0) > 0;
  }

  emitOrganizationMembershipChanged(
    userId: bigint,
    organizationId: bigint,
  ): void {
    this.server
      .to(`user:${userId.toString()}`)
      .emit('organization:membership-changed', {
        organizationId: organizationId.toString(),
      });
  }

  emitFriendshipChanged(recipientId: string, userId: string): void {
    this.server
      .to(`user:${recipientId}`)
      .emit('friendship:changed', { userId });
  }

  emitProfileUpdated(userId: string): void {
    void this.getFriendIds(userId)
      .then((friendIds) => {
        for (const friendId of friendIds) {
          this.server
            .to(`user:${friendId}`)
            .emit('profile:updated', { userId });
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to broadcast profile update:', error);
      });
  }

  emitOrganizationUpdated(organizationId: string): void {
    this.server.emit('organization:updated', { organizationId });
  }

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private async getFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACTIVE',
        blocked_by_user_id: null,
        OR: [
          { user1_id: BigInt(userId) },
          { user2_id: BigInt(userId) },
        ],
      },
      select: {
        user1_id: true,
        user2_id: true,
      },
    });

    return friendships.map((friendship) =>
      (friendship.user1_id === BigInt(userId)
        ? friendship.user2_id
        : friendship.user1_id
      ).toString(),
    );
  }

  private async emitPresenceToFriends(
    userId: string,
    event: 'presence:online' | 'presence:offline',
  ): Promise<void> {
    const friendIds = await this.getFriendIds(userId);

    for (const friendId of friendIds) {
      this.server.to(`user:${friendId}`).emit(event, { userId });
    }
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    const token = client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        id: string;
      }>(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'fallback-secret',
      });

      client.data.userId = payload.id;
      client.join(`user:${payload.id}`);

      const room = `user:${payload.id}`;
      const connectionCount =
        this.server.sockets.adapter.rooms.get(room)?.size ?? 0;

      await this.prisma.user.update({
        where: {
          user_id: BigInt(payload.id),
        },
        data: {
          last_seen_at: new Date(),
        },
      });

      if (connectionCount === 1) {
        try {
          await this.emitPresenceToFriends(payload.id, 'presence:online');
        } catch (error) {
          console.error('Failed to broadcast online presence:', error);
        }
      }
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId as string | undefined;

    if (!userId) return;

    try {
      await this.prisma.user.update({
        where: {
          user_id: BigInt(userId),
        },
        data: {
          last_seen_at: new Date(),
        },
      });
    } catch (error) {
      console.error(
        `Failed to update last_seen_at for user ${userId}:`,
        error,
      );
    }

    const room = `user:${userId}`;
    const remainingConnections =
      this.server.sockets.adapter.rooms.get(room)?.size ?? 0;

    if (remainingConnections === 0) {
      try {
        await this.emitPresenceToFriends(userId, 'presence:offline');
      } catch (error) {
        console.error('Failed to broadcast offline presence:', error);
      }
    }
  }
}