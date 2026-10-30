import { Controller, Get, Post, Body, Param, UseGuards, Req } from "@nestjs/common";
import { DirectMessagesService } from "./directmessages.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth-guard";
import { CreateDirectMessageDto } from "./dto/create-message.dto";

@Controller('direct-messages')
@UseGuards(JwtAuthGuard)
export class DirectMessagesController {
  constructor(private readonly dmService: DirectMessagesService) {}

	@Post(':friendId')
	async sendMessage(
		@Req() req: any,
		@Param('friendId') friendId: string,
		@Body() dto: CreateDirectMessageDto
	) {
		const userId = BigInt(req.user.id);
		const targetUserId = BigInt(friendId);

		const message = await this.dmService.sendMessage(userId, targetUserId, dto);

		return {
			...message,
			message_id: message.message_id.toString(),
			sender_id: message.sender_id.toString(),
			receiver_id: message.receiver_id.toString()
		};
	}

	@Get('unread-count')
	async getUnreadCount(@Req() req: any) {
		return this.dmService.countUnreadMessages(BigInt(req.user.id));
	}

	@Get(':friendId')
	async getMessages(
		@Req() req: any,
		@Param('friendId') friendId: string
	) {
		const userId = BigInt(req.user.id);
		const targetUserId = BigInt(friendId);

		const messages = await this.dmService.getMessages(userId, targetUserId);

		if (!Array.isArray(messages)) {
			return messages;
		}

		return messages.map((message) => ({
			...message,
			message_id: message.message_id.toString(),
			sender_id: message.sender_id.toString(),
			receiver_id: message.receiver_id.toString()
		}));
	}
}