import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDirectMessageDto } from './dto/create-message.dto';
import { NotificationType } from '../../generated/prisma/client';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class DirectMessagesService {
	private readonly logger = new Logger(DirectMessagesService.name);

	constructor(
		private prisma: PrismaService,
		private notifications: NotificationsService,
		private readonly realtimeGateway: RealtimeGateway,
	) {}

	async sendMessage(senderId: bigint, receiverId: bigint, dto: CreateDirectMessageDto) {
		// Check if the receiver exists
		const friendship = await this.prisma.friendship.findFirst({
			where: {
				status: 'ACTIVE',
				OR: [
					{ user1_id: senderId, user2_id: receiverId },
					{ user1_id: receiverId, user2_id: senderId }
				],
				user1: { account_status: 'ACTIVE' },
				user2: { account_status: 'ACTIVE' }
			},
		});

		if (!friendship) {
			throw new ForbiddenException('You can only send messages to active friends.');
		}

		const msgCount = await this.prisma.directMessage.count({
			where: {
				OR: [
					{ sender_id: senderId, receiver_id: receiverId },
					{ sender_id: receiverId, receiver_id: senderId },
				],
			},
		});

		// If the message count is 256 or more, delete the oldest message (FIFO)
		if (msgCount >= 256) {
			const oldestMessage = await this.prisma.directMessage.findFirst({
				where: {
					OR: [
						{ sender_id: senderId, receiver_id: receiverId },
						{ sender_id: receiverId, receiver_id: senderId },
					],
				},
				orderBy: { created_at: 'asc' },
			});

			if (oldestMessage) {
				await this.prisma.directMessage.delete({
					where: { message_id: oldestMessage.message_id },
				});
			}
		}

		// Create the new message
		const message = await this.prisma.directMessage.create({
			data: {
				sender_id: senderId,
				receiver_id: receiverId,
				content: dto.content,
			},
		});

		this.realtimeGateway.server
			.to(`user:${receiverId.toString()}`)
			.emit('direct-message:new', {
				...message,
				message_id: message.message_id.toString(),
				sender_id: message.sender_id.toString(),
				receiver_id: message.receiver_id.toString(),
			});

		// Create Notification
		await this.notifications.notifyUser({
			userId: receiverId,
			type: NotificationType.NEW_MESSAGE,
			title: 'New Direct Message',
			message: dto.content.length > 50
				? `${dto.content.substring(0, 47)}...`
				: dto.content
		});

		return message;
	}

	async getMessages(userId: bigint, friendId: bigint) {
		// Check if friendship exists
		const friendship = await this.prisma.friendship.findFirst({
			where: {
				status: 'ACTIVE',
				OR: [
					{ user1_id: userId, user2_id: friendId },
					{ user1_id: friendId, user2_id: userId }
				],
				user1: { account_status: 'ACTIVE' },
				user2: { account_status: 'ACTIVE' }
			},
		});

		if (!friendship) {
			throw new ForbiddenException('You can only view messages with your active friends.');
		}

		// Set messages readed
		await this.prisma.directMessage.updateMany({
			where: {
				sender_id: friendId,
				receiver_id: userId,
				is_read: false
			},
			data: {
				is_read: true
			}
		});

		// Retrieve messages between the two users
		const messages = await this.prisma.directMessage.findMany({
			where: {
				OR: [
					{ sender_id: userId, receiver_id: friendId },
					{ sender_id: friendId, receiver_id: userId },
				],
			},
			orderBy: { created_at: 'asc' },
		});

		return messages;
	}

	// Cron job to delete messages older than 60 days
	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async purgeOldMessages() {
		this.logger.log('Purging old direct messages...');

		const sixtyDaysAgo = new Date();
		sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

		try {
			const result = await this.prisma.directMessage.deleteMany({
				where: {
					created_at: { lt: sixtyDaysAgo }
				},
			});

			if (result.count > 0) {
				this.logger.log(`Purged ${result.count} old direct messages.`);
			} else {
				this.logger.log('No old direct messages to purge.');
			}
		} catch (error) {
			this.logger.error('Error occurred while purging old direct messages:', error);
		}
	}

	async countUnreadMessages(userId: bigint) {
		const count = await this.prisma.directMessage.count({
			where: {
			receiver_id: userId,
			is_read: false,
			},
		});

		return { count };
	}
}