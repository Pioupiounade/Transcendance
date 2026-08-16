import { Body, Controller, Get, Post, Param, Patch, Query } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

  @Get('me')
  findOwnProfile(
    @Query('current_user_id') currentUserId: string) {
    return this.profilesService.findOwnProfile(currentUserId);
  }

  @Get(':userId')
  findOne(@Param('userId') userId: string) {
    return this.profilesService.findOne(userId);
  }

  @Post()
  create(
    @Query('current_user_id') currentUserId: string,
    @Body() data: CreateProfileDto) {
    return this.profilesService.create(currentUserId, data);
  }

  @Patch('me')
  updateProfile(
    @Query('current_user_id') currentUserId: string,
    @Body() data: UpdateProfileDto,
  ) {
      return this.profilesService.updateProfile(currentUserId, data);
  }
}
