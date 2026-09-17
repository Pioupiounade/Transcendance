import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
	constructor(
		private usersService: UsersService,
		private configService: ConfigService,
		private jwtService: JwtService,
		private prisma: PrismaService,
	) {}

	async register(data: CreateUserDto) {
		const createdUser = await this.usersService.create(data);
		
		// Create both Token and Refresh Token
		const tokens = await this.generateTokenPair(
			createdUser.user_id.toString(),
			createdUser.email,
			createdUser.role,
		);

		await this.updateRefreshDb(tokens.refresh_token, createdUser.user_id.toString());

		const user = await this.usersService.findOne(createdUser.user_id.toString());

		const { refresh_token, ...safeUser } = user;

		return {
			user: safeUser,
			...tokens,
		};
	}

	async login(email: string, password: string) {
		const user = await this.usersService.findOneByEmail(email);
		if (!user) {
			throw new UnauthorizedException('Invalid credentials');
		}

		const isPasswordValid = await argon2.verify(user.password_hash, password);
		if (!isPasswordValid) {
			throw new UnauthorizedException('Invalid credentials');
		}

		const tokens = await this.generateTokenPair(
			user.user_id.toString(),
			user.email,
			user.role,
		);

		await this.updateRefreshDb(tokens.refresh_token, user.user_id.toString());

		const { password_hash, refresh_token, ...userWithoutPassword } = user;

		return {
			user: {
				...userWithoutPassword,
				user_id: user.user_id.toString(),
			},
			...tokens,
		};
	}
	
	async logout(userId: string) {
		await this.updateRefreshDb(null, userId);
		return { message: 'Logout successful' };
	}

	async refreshTokens(userId: string, refreshToken: string) {
		const user = await this.usersService.findOne(userId);
		if (!user || !user.refresh_token) {
			throw new UnauthorizedException('Access Denied');
		}

		const isRefreshValid = await argon2.verify(user.refresh_token, refreshToken);
		if (!isRefreshValid) {
			throw new UnauthorizedException('Access Denied');
		}

		const tokens = await this.generateTokenPair(
			user.user_id.toString(),
			user.email,
			user.role,
		);

		await this.updateRefreshDb(tokens.refresh_token, user.user_id.toString());

		return tokens;
	}

	async getProfile(userId: string) {
		const user = await this.usersService.findOne(userId);

		const { refresh_token, ...profile } = user;

		return profile;
	}


	private async generateTokenPair(userId: string, email: string, role: string) {
		const jwtPayload = { id: userId, email: email, role: role };

		const [accessToken, refreshToken] = await Promise.all([
			this.jwtService.signAsync(jwtPayload, {
				secret: this.configService.get<string>('JWT_SECRET') || 'fallback-secret',
				expiresIn: '15m',
			}),
			this.jwtService.signAsync(jwtPayload, {
				secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'fallback-refresh-secret',
				expiresIn: '7d',
			}),
		]);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
		};
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
}