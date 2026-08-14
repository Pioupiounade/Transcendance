import { Body, Controller, Get, Post, Param, Patch } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

//Quand une requete HTTP GET arrive sur la route Organizations = J'execute la methode findAll()
@Controller('organizations') // route /Organizations
export class OrganizationsController {
// J'injecte UsersService dans UsersController
    constructor(private organizationsService: OrganizationsService) {} 
  
    @Get() // si requete GET
    findAll() { // execute cette methode
        return this.organizationsService.findAll(); // retourne le resultat de la methode
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.organizationsService.findOne(id);
    }

    @Post() // si requet POST
    create(@Body() data: CreateOrganizationDto) { //execute la methode create() et recupere ces donnees dans data
        return this.organizationsService.create(data);
    }

    @Patch(':id')
    update(
        @Param('id') id:string,
        @Body() data: UpdateOrganizationDto,
    ) {
        return this.organizationsService.update(id, data);
    }

    @Patch(':id/deactivate')
    deactivate(@Param('id') id: string) {
        return this.organizationsService.deactivate(id);
    }
}
