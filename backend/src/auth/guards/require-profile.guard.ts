import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RequireProfileGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      return false;
    }

    const profile = await this.prisma.profile.findUnique({
      where: {
        user_id: BigInt(userId),
      },
      select: {
        user_id: true,
      },
    });

    if (!profile) {
      throw new BadRequestException(
        'Create your profile before using this feature',
      );
    }

    return true;
  }
}