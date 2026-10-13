import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDirectMessageDto } from './dto/create-message.dto';

@Injectable()
export class DirectMessagesService {
	constructor(private prisma: PrismaService) { }

	async sendMessage(senderId: bigint, receiverId: bigint, dto: CreateDirectMessageDto) {
		// Check if the receiver exists
		const friendship = await this.prisma.friendship.findFirst({
			where: {
				status: 'ACTIVE',
				OR: [
					{ user1_id: senderId, user2_id: receiverId },
					{ user1_id: receiverId, user2_id: senderId },
				],
			},
		});

		if (!friendship) {
			throw new ForbiddenException('You can only send messages to your friends.');
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
		return message;
	}

	async getMessages(userId: bigint, friendId: bigint) {
		// Check if friendship exists
		const friendship = await this.prisma.friendship.findFirst({
			where: {
				status: 'ACTIVE',
				OR: [
					{ user1_id: userId, user2_id: friendId },
					{ user1_id: friendId, user2_id: userId },
				],
			},
		});

		if (!friendship) {
			throw new ForbiddenException('You can only view messages with your friends.');
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
}