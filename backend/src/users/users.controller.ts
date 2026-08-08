import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

//Quand une requete HTTP GET arrive sur la route Users = J'execute la methode findAll()
@Controller('users') // route /users
export class UsersController {
// J'injecte UsersService dans UsersController
    constructor(private usersService: UsersService) {} 
  
    @Get() // si requete GET
    findAll() { // execute cette methode
        return this.usersService.findAll(); // retourne le resultat de la methode
    }
}
