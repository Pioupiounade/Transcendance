import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret', // Use a fallback secret if JWT_SECRET is not set
    });
  }

  async validate(payload: {
    id: string;
    email: string;
    role: string;
    sessionId: string;
  }) {
    if (!payload || !payload.id || !payload.sessionId) {
      throw new UnauthorizedException();
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  }
}
