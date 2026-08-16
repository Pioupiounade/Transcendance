import { Controller, Get, Post, Delete, Param, Query} from '@nestjs/common';
import { ParticipationsService } from './participations.service';

@Controller('participations')
export class ParticipationsController {
  constructor(private participationsService: ParticipationsService) {}

    @Post(':actionId')
    participate(
    @Param('actionId') actionId: string,
    @Query('current_user_id') currentUserId: string
    ) {
    return this.participationsService.participate(
      currentUserId,
      actionId,
    );
    }

    @Delete(':actionId')
    cancelParticipation(
    @Param('actionId') actionId: string,
    @Query('current_user_id') currentUserId: string,
    ) {
    return this.participationsService.cancelParticipation(
      currentUserId,
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

    @Get('me')
    findMyParticipations(
    @Query('current_user_id') currentUserId: string,
    ) {
    return this.participationsService.findMyParticipations(
      currentUserId,
    );
    }
}