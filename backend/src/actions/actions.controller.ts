import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActionsService } from './actions.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { Category, ActionStatus } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { createStorageOptions } from '../common/multer.config';
import { WebpCompressorPipe } from '../common/shart-transform.pipe';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ParseIntPipe } from '@nestjs/common/pipes/parse-int.pipe';

@Controller('actions')
export class ActionsController {
  constructor(private actionsService: ActionsService) {}

  @Get()
  findAll(
    @Query('organization_id') organizationId?: string,
    @Query('category') category?: Category,
    @Query('creator_id') creatorId?: string,
    @Query('status') status?: ActionStatus,
  ) {
    if (organizationId) {
      return this.actionsService.findByOrganization(organizationId);
    }

    if (category) {
      return this.actionsService.findByCategory(category);
    }

    if (creatorId) {
      return this.actionsService.findByCreator(creatorId);
    }

    if (status) {
      return this.actionsService.findByStatus(status);
    }

    return this.actionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actionsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: any,
    @Body() data: CreateActionDto,
  ) {
    return this.actionsService.create(
      req.user.id,
      data,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: UpdateActionDto,
  ) {
    return this.actionsService.update(
      id,
      data,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/approve')
  approve(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.actionsService.approve(
      id,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.actionsService.cancel(
      id,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/complete')
  complete(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.actionsService.complete(
      id,
      req.user.id,
    );
  }

  // Comments routes
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('id', ParseIntPipe) actionId: string,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.actionsService.addComment(BigInt(actionId), BigInt(req.user.id), dto);
  }

  @Get(':id/comments')
  async getComments(@Param('id', ParseIntPipe) actionId: string) {
    return this.actionsService.getComments(BigInt(actionId));
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/photo-before')
  @UseInterceptors(FileInterceptor('file', createStorageOptions('actions')))
  uploadPhotoBefore(
    @Param('id') id: string,
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
      WebpCompressorPipe,
    )
    processedFilename: string,
  ) {
    const photoUrl = `/static/actions/${processedFilename}`;
    return this.actionsService.updatePhotoBefore(id, photoUrl, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/photo-after')
  @UseInterceptors(FileInterceptor('file', createStorageOptions('actions')))
  uploadPhotoAfter(
    @Param('id') id: string,
    @Req() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
      WebpCompressorPipe,
    )
    processedFilename: string,
  ) {
    const photoUrl = `/static/actions/${processedFilename}`;
    return this.actionsService.updatePhotoAfter(id, photoUrl, req.user.id);
  }
}