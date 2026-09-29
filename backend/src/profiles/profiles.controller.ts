import { Body, Controller, Get, Post, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth-guard';


@Controller('profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Get()
  findAll() {
    return this.profilesService.findAll();
  }

  @Get('search')
  findByUsername(@Query('q') q: string) {
    return this.profilesService.findByUsername(q);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findOwnProfile(@Req() req: any) {
    return this.profilesService.findOwnProfile(req.user.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':userId')
  findOne(@Param('userId') userId: string, @Req() req: any) {
    return this.profilesService.findOne(userId, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: any,
    @Body() data: CreateProfileDto,
  ) {
    return this.profilesService.create(req.user.id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(
    @Req() req: any,
    @Body() data: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(req.user.id, data);
  }
}
