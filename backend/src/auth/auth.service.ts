import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
	constructor(private usersService: UsersService) {}

	async register(data: CreateUserDto) {
		const createdUser = await this.usersService.create(data);
		const token = this.generateToken({
			sub: createdUser.user_id,
			email: createdUser.email,
			role: createdUser.role,
		});

		return {
			user: createdUser,
			token,
		};
	}

	async login(email: string, password: string) {
		const user = await this.usersService.findByEmail(email);

		if (!user) {
			throw new Error('Invalid credentials');
		}

	// Token expiration is set to 7 days
	private generateToken(payload: Record<string, unknown>) {
		const header = {
			alg: 'HS256',
			typ: 'JWT',
		};

		const issuedAt = Math.floor(Date.now() / 1000);
		const tokenPayload = {
			...payload,
			iat: issuedAt,
			exp: issuedAt + 60 * 60 * 24 * 7,
		};

		const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
		const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload));
		const secret = process.env.JWT_SECRET ?? 'dev-secret';

		const signature = createHmac('sha256', secret)
			.update(`${encodedHeader}.${encodedPayload}`)
			.digest('base64url');

		return `${encodedHeader}.${encodedPayload}.${signature}`;
	}

	private base64UrlEncode(value: string) {
		return Buffer.from(value).toString('base64url');
	}
}