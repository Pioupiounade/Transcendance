import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
	constructor(
		private usersService: UsersService,
		private jwtService: JwtService,
	) {}

	async register(data: CreateUserDto) {
		const createdUser = await this.usersService.create(data);
		
		// Create JWT
		// Take id, email and role to match the strandard of the JWT payload
		const token = await this.jwtService.signAsync({
			id: createdUser.user_id,
			email: createdUser.email,
			role: createdUser.role,
		})

		return {
			user: createdUser,
			token,
		};
	}

	async login(email: string, password: string) {
		const user = await this.usersService.findOneByEmail(email);
		if (!user) {
			throw new Error('Invalid Identifiers');
		}

		const isPasswordValid = await argon2.verify(user.password_hash, password);
		if (!isPasswordValid) {
			throw new Error('Invalid Identifiers');
		}

		const token = await this.jwtService.signAsync({
			id: user.user_id,
			email: user.email,
			role: user.role,
		});

		const { password_hash, ...userWithoutPassword } = user;

		return {
			user: {
				...userWithoutPassword,
				user_id: user.user_id.toString(),
			},
			token,
		};
	}
}