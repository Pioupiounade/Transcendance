import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
//import { JwtAuthGuard } from '../guards/jwt-auth.guard';

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

	//@UseGuards(JwtAuthGuard)
	@Post('logout')
	@HttpCode(HttpStatus.OK)
	logout() {
		return this.authService.logout();
	}
}