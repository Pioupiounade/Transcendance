import { Injectable, ForbiddenException } from '@nestjs/common';
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

	validate(req: Request, payload: any) {
		const authHeader = req.body.refresh_token;
		if (!authHeader) {
			throw new ForbiddenException('Missing refresh token');
		}

		const refreshToken = authHeader.replace('Bearer ', '').trim();
		return { ...payload, refreshToken }; // Include the refresh token in the returned payload
	}
}