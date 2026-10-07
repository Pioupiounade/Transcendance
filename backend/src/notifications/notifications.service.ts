import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '../../generated/prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findMine(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        user_id: BigInt(userId),
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        notification_id: BigInt(notificationId),
        user_id: BigInt(userId),
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: {
        notification_id: BigInt(notificationId),
      },
      data: {
        read: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        user_id: BigInt(userId),
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async notifyUser(params: {
  userId: bigint;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  const preference = await this.prisma.notificationPreference.findUnique({
    where: {
      user_id_type: {
        user_id: params.userId,
        type: params.type,
      },
    },
  });

  if (preference && !preference.enabled) {
    return null;
  }

  return this.prisma.notification.create({
    data: {
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    },
  });
}
    async getPreferences(userId: string) {
  const preferences =
    await this.prisma.notificationPreference.findMany({
      where: {
        user_id: BigInt(userId),
      },
    });

  return preferences;
}

async updatePreference(
  userId: string,
  type: NotificationType,
  enabled: boolean,
) {
  return this.prisma.notificationPreference.upsert({
    where: {
      user_id_type: {
        user_id: BigInt(userId),
        type,
      },
    },
    update: {
      enabled,
    },
    create: {
      user_id: BigInt(userId),
      type,
      enabled,
    },
  });
}

}