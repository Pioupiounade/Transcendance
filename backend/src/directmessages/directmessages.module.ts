import { Module } from '@nestjs/common';
import { DirectMessagesService } from './directmessages.service';
import { DirectMessagesController } from './directmessages.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from "../prisma/prisma.module";

@Module({
	imports: [PrismaModule, NotificationsModule],
	controllers: [DirectMessagesController],
	providers: [DirectMessagesService],
})
export class DirectMessagesModule {}