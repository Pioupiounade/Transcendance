import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { Category } from '../../generated/prisma/client';
import { ActionStatus } from '../../generated/prisma/client';

@Injectable()
export class ActionsService {
 
  constructor(private prisma: PrismaService) {}

//1. recuperer toutes les actions
// GET /actions
async findAll() {
  const actions = await this.prisma.action.findMany();

  return actions.map((action) => ({
    ...action,
    action_id: action.action_id.toString(),
    creator_id: action.creator_id.toString(),
    organization_id: action.organization_id?.toString() ?? null,
    validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
  }));
}

//2. recupere une action grace a son id
// GET /actions/:id
  async findOne(id: string) {
    const action = await this.prisma.action.findUnique({
      where: {
        action_id: BigInt(id),
      },
    });

    if(!action) {
      throw new NotFoundException('Action not found');
    }
    
    return {
      ...action,
      action_id: action.action_id.toString(),
      creator_id: action.creator_id.toString(),
      organization_id: action.organization_id?.toString() ?? null,
      validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
      };
  }

//3. recupere des actions par organization
// GET /actions?organization_id=2
  async findByOrganization(id: string) {
    const actions = await this.prisma.action.findMany({
      where: {
        organization_id: BigInt(id),
      },
    });

    if(actions.length === 0) {
      throw new NotFoundException('No actions found for this organization');
    }
    
    return actions.map((action) => ({
      ...action,
      action_id: action.action_id.toString(),
      creator_id: action.creator_id.toString(),
      organization_id: action.organization_id?.toString() ?? null,
      validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
      }));
  }

//4. recupere des actions par categorie
// GET /actions?category=ENVIRONMENT
  async findByCategory(category: Category) {
    const actions = await this.prisma.action.findMany({
      where: {
        category: category,
      },
    });

    if(actions.length === 0) {
      throw new NotFoundException('No actions found for this category');
    }
    
    return actions.map((action) => ({
      ...action,
      action_id: action.action_id.toString(),
      creator_id: action.creator_id.toString(),
      organization_id: action.organization_id?.toString() ?? null,
      validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
      }));
  }

//5. recupere des actions par createur
// GET /actions?creator_id=1
  async findByCreator(id: string) {
    const actions = await this.prisma.action.findMany({
      where: {
        creator_id: BigInt(id)
      },
    });

    if(actions.length === 0) {
      throw new NotFoundException('No actions found for this user');
    }
    
    return actions.map((action) => ({
      ...action,
      action_id: action.action_id.toString(),
      creator_id: action.creator_id.toString(),
      organization_id: action.organization_id?.toString() ?? null,
      validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
      }));
  }


//6. recupere des actions par statut
// GET /actions?status=APPROVED
  async findByStatus(status: ActionStatus) {
    const actions = await this.prisma.action.findMany({
      where: {
        status: status,
      },
    });

    if(actions.length === 0) {
      throw new NotFoundException('No actions found for this status');
    }
    
    return actions.map((action) => ({
      ...action,
      action_id: action.action_id.toString(),
      creator_id: action.creator_id.toString(),
      organization_id: action.organization_id?.toString() ?? null,
      validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
      }));
  }

//7. creer une nouvelle action
  async create(data: CreateActionDto) {

    const createdAction = await this.prisma.action.create({
      data: {
        title: data.title,
        description: data.description,
        creator_id: BigInt(data.creator_id),
        organization_id: data.organization_id? BigInt(data.organization_id) : null,
        location: data.location,
        category: data.category,
        imagesList: data.imagesList,
        scheduled_at: new Date(data.scheduled_at),
      },
    });

    return {
      ...createdAction,
      action_id: createdAction.action_id.toString(),
      creator_id: createdAction.creator_id.toString(),
      organization_id: createdAction.organization_id?.toString() ?? null,
      validated_by_user_id: createdAction.validated_by_user_id?.toString() ?? null,
      };
  }

  //8. mettre a jour les donnees de l'action
  async update(id: string, data: UpdateActionDto) {
    const action = await this.prisma.action.update({
      where: {
        action_id: BigInt(id),
      },
      data: {
        title: data.title,
        description: data.description,
        organization_id: data.organization_id? BigInt(data.organization_id) : undefined,
        location: data.location,
        category: data.category,
        imagesList: data.imagesList,
        scheduled_at: data.scheduled_at? new Date(data.scheduled_at) : undefined,
      },
    });
    
    return {
      ...action,
      action_id: action.action_id.toString(),
      creator_id: action.creator_id.toString(),
      organization_id: action.organization_id?.toString() ?? null,
      validated_by_user_id: action.validated_by_user_id?.toString() ?? null,
      };
  }

//9. annuler une action
  async cancel(id: string) {
    const action = await this.prisma.action.findUnique({
      where: {
        action_id: BigInt(id),
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (
      action.status !== ActionStatus.PENDING &&
      action.status !== ActionStatus.APPROVED
    ) {
      throw new BadRequestException(
        'This action can no longer be cancelled',
      );
    }

    const updatedAction = await this.prisma.action.update({
      where: {
        action_id: BigInt(id),
      },
      data: {
        status: ActionStatus.CANCELLED,
      },
    });

    return {
      ...updatedAction,
      action_id: updatedAction.action_id.toString(),
      creator_id: updatedAction.creator_id.toString(),
      organization_id: updatedAction.organization_id?.toString() ?? null,
      validated_by_user_id:
        updatedAction.validated_by_user_id?.toString() ?? null,
    };
  }

//10. terminer une action
  async complete(id: string) {
    const action = await this.prisma.action.findUnique({
      where: {
        action_id: BigInt(id),
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (action.status !== ActionStatus.APPROVED) {
      throw new BadRequestException(
        'Only an approved action can be completed',
      );
    }

    const updatedAction = await this.prisma.action.update({
      where: {
        action_id: BigInt(id),
      },
      data: {
        status: ActionStatus.COMPLETED,
      },
    });

    return {
      ...updatedAction,
      action_id: updatedAction.action_id.toString(),
      creator_id: updatedAction.creator_id.toString(),
      organization_id: updatedAction.organization_id?.toString() ?? null,
      validated_by_user_id:
        updatedAction.validated_by_user_id?.toString() ?? null,
    };
  }
}