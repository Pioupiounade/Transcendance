import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PointtransactionService } from './pointtransaction.service';
import { AdminAddPointsDto } from './dto/admin-add-points.dto';

@Controller('point-transactions')
export class PointtransactionController {
  constructor(
    private readonly pointtransactionService: PointtransactionService,
  ) {}

  @Post('actions/:actionId/completed')
  rewardActionCompleted(
    @Param('actionId') actionId: string,
  ) {
    return this.pointtransactionService.rewardActionCompleted(
      BigInt(actionId),
    );
  }

  @Post('actions/:actionId/participants/:participantId')
  rewardParticipation(
    @Param('actionId') actionId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.pointtransactionService.rewardParticipation(
      BigInt(actionId),
      BigInt(participantId),
    );
  }

  @Post('actions/:actionId/participants/:participantId/creator-reward')
  rewardCreatorForParticipant(
    @Param('actionId') actionId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.pointtransactionService.rewardCreatorForParticipant(
      BigInt(actionId),
      BigInt(participantId),
    );
  }

  @Post('organizations/:organizationId/members/:memberId/reward-owner')
  rewardOwnerForNewMember(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.pointtransactionService.rewardOwnerForNewMember(
      BigInt(organizationId),
      BigInt(memberId),
    );
  }

  @Post('users/:userId/suspension-penalty')
  penalizeSuspendedUser(
    @Param('userId') userId: string,
  ) {
    return this.pointtransactionService.penalizeSuspendedUser(
      BigInt(userId),
    );
  }

  @Post('admin/:adminId/users/:userId/points')
  adminAddPoints(
    @Param('adminId') adminId: string,
    @Param('userId') userId: string,
    @Body() dto: AdminAddPointsDto,
  ) {
    return this.pointtransactionService.adminAddPoints(
      BigInt(adminId),
      BigInt(userId),
      dto.points,
      dto.adjustmentKey,
    );
  }

  @Get('users/:targetUserId/points')
  getUserPoints(
    @Param('targetUserId') targetUserId: string,
  ) {
    const requesterId = BigInt(targetUserId);

    return this.pointtransactionService.getUserPoints(
      requesterId,
      BigInt(targetUserId),
    );
  }

  @Get('users/:targetUserId')
  getUserPointTransactions(
    @Param('targetUserId') targetUserId: string,
  ) {
    const requesterId = BigInt(targetUserId);

    return this.pointtransactionService.getUserPointTransactions(
      requesterId,
      BigInt(targetUserId),
    );
  }
}