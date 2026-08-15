import { Body, Controller, Get, Post, Param, Patch, Query } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

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

  @Post()
  create(@Body() data: CreateOrganizationDto) {
    return this.organizationsService.create(data);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateOrganizationDto,
  ) {
    // currentUserId à ajouter quand l'auth sera branchée
  }

  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    // currentUserId à ajouter quand l'auth sera branchée
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    // currentUserId à ajouter quand l'auth sera branchée
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    // currentUserId à ajouter quand l'auth sera branchée
  }
}
