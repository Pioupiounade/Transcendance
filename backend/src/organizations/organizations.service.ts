import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class OrganizationsService {
 
  constructor(private prisma: PrismaService) {}

//1. recuperer toutes les organisations
  async findAll() {
    const organisations = await this.prisma.organization.findMany();

    return organization_id: organization.organization_id.toString();
    };
  }

  //2. hasher le mdp - creer le nouvel utilisateur - l'id se genere automatiquement
  async create(data: CreateUserDto) {
    const password_hash = await argon2.hash(data.password);

    const createdUser = await this.prisma.user.create({
      data: {
        email: data.email,
        password_hash,
      },
    });

    const { password_hash: _, ...user } = createdUser;

    return {
      ...user,
      user_id: user.user_id.toString(),
    };
  }

  //3. recupere un utilisateur grace a son id
  async findOne(id: string) { // Nest JS recupere l'id de l'URL comme un string
    const user = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(id), // cherche dans la PostgreSQL apres avoir converti le string en BigInt
      },
    });

    if(!user) {
      throw new NotFoundException('User not found');
    }
    
    // On retire le password_hash
    const { password_hash, ...safeUser } = user;

    // On retourne l'utilisateur avec son BigInt converti en string
    return {
      ...safeUser,
      user_id: safeUser.user_id.toString(),
    };
  }

  //4. mettre a jour les donnees dl'utilisateur
  async update(id: string, data: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: {
        user_id: BigInt(id),
      },
      data: {
        email:data.email,
      },
    });
    
    // On retire le password_hash
    const { password_hash, ...safeUser } = user;

    // On retourne l'utilisateur avec son BigInt converti en string
    return {
      ...safeUser,
      user_id: safeUser.user_id.toString(),
    };
  }

//5. desactiver un utilisateur
  async deactivate(id: string) {
  const user = await this.prisma.user.update({
    where: {
      user_id: BigInt(id),
    },
    data: {
      account_status: 'DEACTIVATED',
    },
  });

  const { password_hash, ...safeUser } = user;

  return {
    ...safeUser,
    user_id: safeUser.user_id.toString(),
  };
}
}