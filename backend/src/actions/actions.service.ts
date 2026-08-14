import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';

@Injectable()
export class ActionsService {
 
  constructor(private prisma: PrismaService) {}

//1. recuperer toutes les actions
async findAll() {
  const organizations = await this.prisma.organization.findMany();

  return organizations.map((organization) => ({
    ...organization,
    organization_id: organization.organization_id.toString(),
    creator_id: organization.creator_id.toString(),
  }));
}
   //2. recupere une organisation grace a son id
  async findOne(id: string) { // Nest JS recupere l'id de l'URL comme un string
    const organization = await this.prisma.organization.findUnique({
      where: {
        organization_id: BigInt(id), // cherche dans la PostgreSQL apres avoir converti le string en BigInt
      },
    });

    if(!organization) {
      throw new NotFoundException('Organization not found');
    }
    
     // On retourne l'utilisateur avec son BigInt converti en string
    return {
      ...organization,
      organization_id: organization.organization_id.toString(),
      creator_id: organization.creator_id.toString(),
    };
  }

  //3. creer une nouvelle organisation
  async create(data: CreateOrganizationDto) {

    const createdOrganization = await this.prisma.organization.create({
      data: {
        title: data.title,
        description: data.description,
        address: data.address,
        location: data.location,
        creator_id: BigInt(data.creator_id),
      },
    });

    return {
      ...createdOrganization,
      organization_id: createdOrganization.organization_id.toString(),
      creator_id: createdOrganization.creator_id.toString(),
    };
  }

  //4. mettre a jour les donnees de l'organisation
  async update(id: string, data: UpdateOrganizationDto) {
    const organization = await this.prisma.organization.update({
      where: {
        organization_id: BigInt(id),
      },
      data: {
        title:data.title,
        description:data.description,
        address:data.address,
        location:data.location,
      },
    });
    
    // On retourne l'utilisateur avec son BigInt converti en string
    return {
      ...organization,
      organization_id: organization.organization_id.toString(),
      creator_id: organization.creator_id.toString(),
    };
  }

//5. desactiver une organisation
  async deactivate(id: string) {
  const organization = await this.prisma.organization.update({
    where: {
      organization_id: BigInt(id),
    },
    data: {
      organization_status: 'CLOSED',
    },
  });

  return {
    ...organization,
    organization_id: organization.organization_id.toString(),
    creator_id:organization.creator_id.toString(),
  };
}
}