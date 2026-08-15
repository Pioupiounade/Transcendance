import { Body, Controller, Get, Post, Param, Patch, Query } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { Category, ActionStatus } from '../../generated/prisma/client';

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

    @Post()
    create(@Body() data:CreateActionDto) {
        return this.actionsService.create(data);
    }

    @Patch(':id')
    update(
        @Param('id') id : string,
        @Body() data: UpdateActionDto,
    ) {
        return this.actionsService.update(id, data);
    }

    @Patch(':id/cancel')
    cancel(@Param('id') id:string) {
        return this.actionsService.cancel(id);
    }

    @Patch(':id/complete')
    complete(@Param('id') id:string) {
        return this.actionsService.complete(id);
    }   
}