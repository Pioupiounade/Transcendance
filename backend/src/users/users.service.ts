import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as argon2 from 'argon2';
import { AccountStatus } from '../../generated/prisma/client';

@Injectable()
export class UsersService {
// UsersService recoit PrismaService par injection. 
  constructor(private prisma: PrismaService) {}

// Utllise this.prisma pour recuperer les Users dans PostgreSQL. Cette methode metier accede reellement a la BDD via Prisma
//1. recuperer tous les utilisateurs
  async findAll() {
    const users = await this.prisma.user.findMany();

    return users.map(({ password_hash, ...user }) => ({
      ...user,
      user_id: user.user_id.toString(),
    }));
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

  //4. mettre a jour l'adresse mail
  async updateEmail(id: string, data: UpdateUserDto) {
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

  //5. mettre a jour le mdp
  async updatePassword(id: string, data: UpdatePasswordDto) {
    const password_hash = await argon2.hash(data.password);

    const user = await this.prisma.user.update({
      where: {
        user_id: BigInt(id),
      },
      data: {
        password_hash,
      },
    });

    const { password_hash: _, ...safeUser } = user;

    return {
      ...safeUser,
      user_id: safeUser.user_id.toString(),
    };
  }

//6. desactiver un utilisateur
  async deactivate(id: string) {
  const user = await this.prisma.user.update({
    where: {
      user_id: BigInt(id),
    },
    data: {
      account_status: AccountStatus.DEACTIVATED,
    },
  });

  const { password_hash, ...safeUser } = user;

  return {
    ...safeUser,
    user_id: safeUser.user_id.toString(),
  };
}

//7. suspendre un utilisateur
  async suspend(id: string) {
    const updatedUser = await this.prisma.user.update({
      where: {
        user_id: BigInt(id),
      },
      data: {
        account_status: AccountStatus.SUSPENDED,
      },
    });

    const { password_hash: _, ...safeUser } = updatedUser;

    return {
      ...safeUser,
      user_id: safeUser.user_id.toString(),
    };
  }

//8. Reactiver un utilisateur
  async reactivate(id: string) {
      const user = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(id),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.SUSPENDED) {
      throw new BadRequestException(
        'Only a suspended account can be reactivated',
      );
    }
    const updatedUser = await this.prisma.user.update({
      where: {
        user_id: BigInt(id),
      },
      data: {
        account_status: AccountStatus.ACTIVE,
      },
    });

    const { password_hash: _, ...safeUser } = updatedUser;

    return {
      ...safeUser,
      user_id: safeUser.user_id.toString(),
    };
  }

}