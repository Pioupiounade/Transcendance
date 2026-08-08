import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
// UsersService recoit PrismaService par injection. 
  constructor(private prisma: PrismaService) {}

// Utllise this.prisma pour recuperer les Users dans PostgreSQL. Cette methode metier accede reellement a la BDD via Prisma
findAll() {
  return this.prisma.user.findMany();
}
}