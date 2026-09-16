import { Body, Controller, Post, Get, HttpCode, HttpStatus, UseGuards, Request as Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth-guard';
import { JwtRefreshGuard } from './guards/jwt-refresh-guard';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post('register')
	register(@Body() data: CreateUserDto) {
		return this.authService.register(data);
	}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	login(@Body() dto: LoginDto) {
		return this.authService.login(dto.email, dto.password);
	}

	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post('logout')
	logout(@Req() req: Request) {
		const user = (req as any).user;
		return this.authService.logout(user.id);
	}

	@UseGuards(JwtRefreshGuard)
	@HttpCode(HttpStatus.OK)
	@Post('refresh')
	refreshTokens(@Req() req: Request) {
		const user = (req as any).user;
		return this.authService.refreshTokens(user.id, user.refreshToken);
	}

	@UseGuards(JwtAuthGuard)
	@Get('me')
	getProfile(@Req() req: Request) {
		const user = (req as any).user;
		return this.authService.getProfile(user.id);
	}
}