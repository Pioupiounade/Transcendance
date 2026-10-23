import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuthService {
	constructor(
		private usersService: UsersService,
		private configService: ConfigService,
		private jwtService: JwtService,
		private prisma: PrismaService,
	) {}

	async register(data: CreateUserDto) {
		let createdUser;

		try {
			createdUser = await this.usersService.create(data);
		} catch (error) {
			if (
			error instanceof BadRequestException &&
			error.message === 'Email is already used'
			) {
			return {
				success: false as const,
				reason: 'EMAIL_TAKEN' as const,
			};
			}

			throw error;
		}
		
		// Create both Token and Refresh Token
		const tokens = await this.createSessionTokens(
			createdUser.user_id.toString(),
			createdUser.email,
			createdUser.role,
		);

		const user = await this.usersService.findOne(createdUser.user_id.toString());

		const { refresh_token, ...safeUser } = user;

		return {
			success: true as const,
			user: safeUser,
			...tokens,
		};
	}

	async login(email: string, password: string) {
		const user = await this.usersService.findOneByEmail(email);

		if (!user) {
			return {
			success: false as const,
			reason: 'INVALID_CREDENTIALS' as const,
			};
		}

		const isPasswordValid = await argon2.verify(user.password_hash, password);

		if (!isPasswordValid) {
			return {
			success: false as const,
			reason: 'INVALID_CREDENTIALS' as const,
			};
		}

		if (user.account_status === 'DEACTIVATED') {
			return {
				success: false as const,
				reason: 'ACCOUNT_DISABLED' as const,
			};
		}

		const tokens = await this.createSessionTokens(
			user.user_id.toString(),
			user.email,
			user.role,
		);

		const { password_hash, refresh_token, ...userWithoutPassword } = user;

		return {
			success: true as const,
			user: {
			...userWithoutPassword,
			user_id: user.user_id.toString(),
			},
			...tokens,
		};
	}
	
	async logout(userId: string, sessionId: string) {
		if (!sessionId) {
			throw new UnauthorizedException('Invalid session');
		}

		await this.prisma.authSession.deleteMany({
			where: {
			session_id: sessionId,
			user_id: BigInt(userId),
			},
		});

		return { message: 'Logout successful' };
	}

	async refreshTokens(
		userId: string,
		sessionId: string,
		refreshToken: string,
		) {

		if (!sessionId) {
			throw new UnauthorizedException('Invalid session');
		}
		const user = await this.usersService.findOne(userId);

		const authSession = await this.prisma.authSession.findFirst({
			where: {
			session_id: sessionId,
			user_id: BigInt(userId),
			},
		});

		if (!user || !authSession) {
			throw new UnauthorizedException('Access Denied');
		}

		if (authSession.expires_at <= new Date()) {
			throw new UnauthorizedException('Session expired');
		}

		const isRefreshValid = await argon2.verify(
			authSession.refresh_token_hash,
			refreshToken,
		);

		if (!isRefreshValid) {
			throw new UnauthorizedException('Access Denied');
		}

		const tokens = await this.generateTokenPair(
			user.user_id.toString(),
			user.email,
			user.role,
			sessionId,
		);

		await this.prisma.authSession.update({
			where: {
			session_id: sessionId,
			},
			data: {
			refresh_token_hash: await argon2.hash(tokens.refresh_token),
			expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		});

		return tokens;
	}

	async getProfile(userId: string) {
		const user = await this.usersService.findOne(userId);

		const { refresh_token, ...profile } = user;

		return profile;
	}


	private async generateTokenPair(
		userId: string,
		email: string,
		role: string,
		sessionId: string,
	) {
		const jwtPayload = {
			id: userId,
			email,
			role,
			sessionId,
		};

		const [accessToken, refreshToken] = await Promise.all([
			this.jwtService.signAsync(jwtPayload, {
			secret: this.configService.get<string>('JWT_SECRET') || 'fallback-secret',
			expiresIn: '15m',
			}),
			this.jwtService.signAsync(jwtPayload, {
			secret:
				this.configService.get<string>('JWT_REFRESH_SECRET') ||
				'fallback-refresh-secret',
			expiresIn: '7d',
			}),
		]);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
		};
	}

	private async createSessionTokens(
		userId: string,
		email: string,
		role: string,
	) {
		const sessionId = randomUUID();

		const tokens = await this.generateTokenPair(
			userId,
			email,
			role,
			sessionId,
		);

		await this.prisma.authSession.create({
			data: {
			session_id: sessionId,
			user_id: BigInt(userId),
			refresh_token_hash: await argon2.hash(tokens.refresh_token),
			expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		});

		return tokens;
	}

	async updateRefreshDb(refreshToken: string | null, userId: string): Promise<void> {
		let hashedToken: string | null = null;

		if (refreshToken) {
			hashedToken = await argon2.hash(refreshToken);
		}

		await this.prisma.user.update({
			where: { user_id: BigInt(userId) },
			data: { refresh_token: hashedToken },
		});
	}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async purgeExpiredSessions() {
		const result = await this.prisma.authSession.deleteMany({
			where: {
				expires_at: {
				lt: new Date(),
				},
			},
		});

		console.log(`Purged ${result.count} expired auth sessions`);
	}
}