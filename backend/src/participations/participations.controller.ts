import { Controller, Get, Post, Delete, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ParticipationsService } from './participations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

@Controller('participations')
export class ParticipationsController {
  constructor(private participationsService: ParticipationsService) {}

    @UseGuards(JwtAuthGuard)
    @Post(':actionId')
    participate(
      @Req() req: any,
      @Param('actionId') actionId: string,
    ) {
      return this.participationsService.participate(
        req.user.id,
        actionId,
      );
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':actionId')
    cancelParticipation(
      @Req() req: any,
      @Param('actionId') actionId: string,
    ) {
      return this.participationsService.cancelParticipation(
        req.user.id,
        actionId,
      );
    }

    @Get('action/:actionId')
    findParticipantsByAction(
      @Param('actionId') actionId: string,
    ) {
      return this.participationsService.findParticipantsByAction(
        actionId,
      );
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    findMyParticipations(
      @Req() req: any,
    ) {
      return this.participationsService.findMyParticipations(
        req.user.id,
      );
    }
}