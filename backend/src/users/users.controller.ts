import { Body, Controller, Get, Post, Param, Patch, Req, UseGuards, Delete, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: any) {
    return this.usersService.findOneSafe(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/heartbeat')
  heartbeat(@Req() req: any) {
    return this.usersService.updateLastSeen(req.user.id);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOneSafe(id);
  }

  @Post()
  create(@Body() data: CreateUserDto) {
    return this.usersService.create(data);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/email')
  updateEmail(
    @Req() req: any,
    @Body() data: UpdateUserDto,
  ) {
    return this.usersService.updateEmail(
      req.user.id,
      data,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  updatePassword(
    @Req() req: any,
    @Body() data: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(
      req.user.id,
      data,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/deactivate')
  deactivate(@Req() req: any) {
    return this.usersService.deactivate(
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/suspend')
  suspend(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.usersService.suspend(
      id,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reactivate')
  reactivate(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.usersService.reactivate(
      id,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteUser(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    if (!/^[1-9]\d*$/.test(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.usersService.deleteUser(id, req.user.id);
  }
}