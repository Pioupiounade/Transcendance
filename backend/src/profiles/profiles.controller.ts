import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WebpCompressorPipe } from '../common/shart-transform.pipe';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { createStorageOptions } from '../common/multer.config';
import { DeleteFileOnErrorInterceptor } from '../common/interceptor';

@Controller('profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) { }

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

  @Get(':userId')
  findOne(@Param('userId') userId: string) {
    return this.profilesService.findOne(userId);
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

  @Patch('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', createStorageOptions('avatars')),
    DeleteFileOnErrorInterceptor
  )
  async uploadAvatar(
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
      new WebpCompressorPipe({ quality: 80 }), // Résolution intacte, conversion .webp (q: 80)
    )
    processedFilename: string,
  ) {
    const userId = req.user?.id ?? req.user?.user_id ?? req.user?.sub;

    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }

    const avatarUrl = `/static/avatars/${processedFilename}`;
    return this.profilesService.updateProfile(String(userId), {
      profile_picture: avatarUrl,
    });
  }
}
