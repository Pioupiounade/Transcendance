import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SelectInterestDto } from './dto/select-interest.dto';
import { AccountStatus } from '../../generated/prisma/client';

@Injectable()
export class InterestsService {
    constructor(private prisma: PrismaService) {}

//Selectionner un interet
async selectInterest(currentUserId: string, data: SelectInterestDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Only an active user can select interests');
    }

    const existingInterest = await this.prisma.userInterest.findUnique({
      where: {
        user_id_interest: {
          user_id: BigInt(currentUserId),
          interest: data.interest,
        },
      },
    });

    if (existingInterest) {
      throw new BadRequestException(
        'This interest is already selected',
      );
    }

    const selectedInterest = await this.prisma.userInterest.create({
      data: {
        user_id: BigInt(currentUserId),
        interest: data.interest,
      },
    });

    return {
      ...selectedInterest,
      user_id: selectedInterest.user_id.toString(),
    };
  }

//Deselectionner un interet
async removeInterest(currentUserId: string, data: SelectInterestDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Only an active user can remove interests');
    }

    const removedInterest = await this.prisma.userInterest.delete({
      where: {
        user_id_interest: {
            user_id: BigInt(currentUserId),
            interest: data.interest,
        },
      },
    });

    return {
      ...removedInterest,
      user_id: removedInterest.user_id.toString(),
    };
}

//Afficher ses propres interets
async findMyInterests(currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        user_id: BigInt(currentUserId),
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.account_status !== AccountStatus.ACTIVE) {
      throw new BadRequestException('Only an active user can see own interests');
    }

    const myInterests = await this.prisma.userInterest.findMany({
      where: {
            user_id: BigInt(currentUserId),
      },
    });

    return myInterests.map((interest) => ({
    ...interest,
    user_id: interest.user_id.toString(),
  }));
}
}
 