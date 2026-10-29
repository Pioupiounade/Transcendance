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
    this.server.emit('profile:updated', { userId });
  }

  emitOrganizationUpdated(organizationId: string): void {
    this.server.emit('organization:updated', { organizationId });
  }

  emitActionParticipantsChanged(actionId: string): void {
    this.server.emit('action:participants-changed', { actionId });
  }

  emitActionCommentsChanged(actionId: string): void {
    this.server.emit('action:comments-changed', { actionId });
  }

  emitActionUpdated(actionId: string): void {
    this.server.emit('action:updated', { actionId });
  }

  emitOrganizationCommentsChanged(organizationId: string): void {
    this.server.emit('organization:comments-changed', { organizationId });
  }

  emitAccountStatusChanged(
    userId: string,
    accountStatus: 'ACTIVE' | 'SUSPENDED',
  ): void {
    this.server
      .to(`user:${userId}`)
      .emit('account:status-changed', {
        userId,
        accountStatus,
      });
  }

  emitAccountDeleted(userId: string): void {
    const room = `user:${userId}`;

    // Déconnecter les sessions du compte supprimé.
    this.server.to(room).emit('account:deleted', { userId });

    // Prévenir les autres utilisateurs connectés.
    this.server.except(room).emit('user:deleted', { userId });

    this.server.in(room).disconnectSockets(true);
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
        sessionId: string;
      }>(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'fallback-secret',
      });

      if (
        typeof payload.id !== 'string' ||
        !/^[1-9]\d*$/.test(payload.id) ||
        typeof payload.sessionId !== 'string' ||
        !payload.sessionId
      ) {
        client.disconnect();
        return;
      }

      const session = await this.prisma.authSession.findUnique({
        where: {
          session_id: payload.sessionId,
        },
      });

      if (
        !session ||
        session.user_id !== BigInt(payload.id) ||
        session.expires_at <= new Date()
      ) {
        client.disconnect();
        return;
      }

      client.data.userId = payload.id;
      client.join(`user:${payload.id}`);

      const room = `user:${payload.id}`;
      const connectionCount =
        this.server.sockets.adapter.rooms.get(room)?.size ?? 0;

      await this.prisma.user.updateMany({
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
      await this.prisma.user.updateMany({
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

  async emitAdminDirectoryChanged(
    resource: 'users' | 'organizations' | 'actions',
  ): Promise<void> {
    try {
      const admins = await this.prisma.user.findMany({
        where: {
          role: 'ADMIN',
          account_status: 'ACTIVE',
        },
        select: {
          user_id: true,
        },
      });

      const rooms = admins.map(
        (admin) => `user:${admin.user_id.toString()}`,
      );

      if (rooms.length > 0) {
        this.server
          .to(rooms)
          .emit('admin:directory-changed', { resource });
      }
    } catch (error: unknown) {
      console.error('Failed to refresh admin directory:', error);
    }
  }

  emitAccountRoleChanged(
    userId: string,
    role: 'USER' | 'ADMIN',
  ): void {
    this.server
      .to(`user:${userId}`)
      .emit('account:role-changed', {
        userId,
        role,
      });
  }
}