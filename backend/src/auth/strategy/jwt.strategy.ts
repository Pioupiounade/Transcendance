import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret',
    });
  }

  async validate(payload: {
    id: string;
    sessionId: string;
  }) {
    if (
      !payload ||
      typeof payload.id !== 'string' ||
      !/^[1-9]\d*$/.test(payload.id) ||
      typeof payload.sessionId !== 'string' ||
      !payload.sessionId
    ) {
      throw new UnauthorizedException('Invalid session');
    }

    const session = await this.prisma.authSession.findUnique({
      where: {
        session_id: payload.sessionId,
      },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (
      !session ||
      session.user_id !== BigInt(payload.id) ||
      session.expires_at <= new Date()
    ) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    return {
      id: session.user.user_id.toString(),
      email: session.user.email,
      role: session.user.role,
      sessionId: session.session_id,
    };
  }
}