import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
//« Les autres modules qui importent PrismaModule ont le droit d'utiliser PrismaService. »
  exports: [PrismaService],
})
export class PrismaModule {}