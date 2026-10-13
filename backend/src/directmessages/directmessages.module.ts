import { Module } from '@nestjs/common';
import { DirectMessagesService } from './directmessages.service';
import { DirectMessagesController } from './directmessages.controller';
import { PrismaModule } from "../prisma/prisma.module";

@Module({
	imports: [PrismaModule],
	controllers: [DirectMessagesController],
	providers: [DirectMessagesService],
})
export class DirectMessagesModule {}