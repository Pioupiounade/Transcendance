import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

//Quand une requete HTTP GET arrive sur la route Users = J'execute la methode findAll()
@Controller('users') // route /users
export class UsersController {
// J'injecte UsersService dans UsersController
    constructor(private usersService: UsersService) {} 
  
    @Get() // si requete GET
    findAll() { // execute cette methode
        return this.usersService.findAll(); // retourne le resultat de la methode
    }

    @Post() // si requet POST
    create(@Body() data: CreateUserDto) { //execute la methode create() et recupere ces donnees dans data
        return this.usersService.create(data);
  }
}
