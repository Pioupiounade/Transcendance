import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'), // Extract the refresh token from the request body
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret', // Use a fallback secret if JWT_REFRESH_SECRET is not set
			passReqToCallback: true, // Pass the request object to the validate method
		});
	}

	validate(
		req: Request,
		payload: {
			id: string;
			email: string;
			role: string;
			sessionId: string;
		},
	) {
		if (!payload?.sessionId) {
			throw new UnauthorizedException('Missing session ID');
		}

		const refreshToken = req.body?.refresh_token;

		if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
			throw new UnauthorizedException('Missing refresh token');
		}

		return {
			...payload,
			sessionId: payload.sessionId,
			refreshToken: refreshToken.replace(/^Bearer\s+/i, '').trim(),
		};
	}
}