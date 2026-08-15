import { Body, Controller, Get, Post, Param, Patch, Query } from '@nestjs/common';
import { ProfilesService } from './actions.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}
}
