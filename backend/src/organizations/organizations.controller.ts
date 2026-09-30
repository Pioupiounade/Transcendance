import { Body, Controller, Get, Post, Param, Patch, Query, Req, UseGuards, Delete } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { OrganizationCommentDto } from './dto/organization-comments.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private organizationsService: OrganizationsService,
  ) {}

  @Get()
  findAll(
    @Query('creator_id') creatorId?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ) {
    if (creatorId) {
      return this.organizationsService.findByCreator(creatorId);
    }

    if (lat && lng && radius) {
      return this.organizationsService.findByRadius(
        Number(lat),
        Number(lng),
        Number(radius),
      );
    }

    return this.organizationsService.findAll();
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.organizationsService.searchByName(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: any,
    @Body() data: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(
      req.user.id,
      data,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(
      id,
      data,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/suspend')
  suspend(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.organizationsService.suspend(
      id,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/deactivate')
  deactivate(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.organizationsService.deactivate(
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
    return this.organizationsService.reactivate(
      id,
      req.user.id,
    );
  }

  // Endpoint for Comments

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  addComment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: OrganizationCommentDto,
  ) {
    return this.organizationsService.addComment(BigInt(id), BigInt(req.user.id), data.comment);
  }

  @Get(':id/comments')
  getComments(
    @Param('id') id: string,
  ) {
    return this.organizationsService.getComments(BigInt(id));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:commentId')
  async deleteComment(
    @Req() req: any,
    @Param('commentId') commentId: string,
  ) {
    return this.organizationsService.deleteComment(BigInt(commentId), BigInt(req.user.id));
  }
}
