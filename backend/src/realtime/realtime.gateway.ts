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

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    const token = client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        id: string;
      }>(token);

      client.data.userId = payload.id;
      client.join(`user:${payload.id}`);

      await this.prisma.user.update({
        where: {
          user_id: BigInt(payload.id),
        },
        data: {
          last_seen_at: new Date(),
        },
      });

      const room = `user:${payload.id}`;
      const connectionCount = this.server.sockets.adapter.rooms.get(room)?.size ?? 0;

      if (connectionCount === 1) {
        this.server.emit('presence:online', {
          userId: payload.id,
        });
      }
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId as string | undefined;

    if (!userId) return;

    await this.prisma.user.update({
      where: {
        user_id: BigInt(userId),
      },
      data: {
        last_seen_at: new Date(),
      },
    });

    const room = `user:${userId}`;
    const remainingConnections =
      this.server.sockets.adapter.rooms.get(room)?.size ?? 0;

    if (remainingConnections === 0) {
      this.server.emit('presence:offline', {
        userId,
      });
    }
  }
}