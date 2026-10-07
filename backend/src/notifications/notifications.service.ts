import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '../../generated/prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findMine(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        user_id: BigInt(userId),
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return notifications.map((notification) => this.serializeNotification(notification));
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

    const updated = await this.prisma.notification.update({
      where: {
        notification_id: BigInt(notificationId),
      },
      data: {
        read: true,
      },
    });
    return this.serializeNotification(updated);
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
  try {
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

    const notification = await this.prisma.notification.create({
    data: {
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    },
    });
    return this.serializeNotification(notification);
  } catch {
    return null;
  }
}
    async getPreferences(userId: string) {
  const preferences =
    await this.prisma.notificationPreference.findMany({
      where: {
        user_id: BigInt(userId),
      },
    });

  return preferences.map((preference) => ({
    ...preference,
    user_id: preference.user_id.toString(),
  }));
}

async updatePreference(
  userId: string,
  type: NotificationType,
  enabled: boolean,
) {
  const preference = await this.prisma.notificationPreference.upsert({
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
  return {
    ...preference,
    user_id: preference.user_id.toString(),
  };
}

  private serializeNotification(notification: {
    notification_id: bigint;
    user_id: bigint;
    type: NotificationType;
    title: string;
    message: string;
    link: string | null;
    read: boolean;
    created_at: Date;
  }) {
    return {
      ...notification,
      notification_id: notification.notification_id.toString(),
      user_id: notification.user_id.toString(),
    };
  }

}