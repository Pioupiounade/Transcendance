import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PointtransactionService } from './pointtransaction.service';
import { AdminAddPointsDto } from './dto/admin-add-points.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

@Controller('point-transactions')
export class PointtransactionController {
  constructor(
    private readonly pointtransactionService: PointtransactionService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('admin/users/:userId/points')
  adminAddPoints(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() dto: AdminAddPointsDto,
  ) {
    return this.pointtransactionService.adminAddPoints(
      BigInt(req.user.id),
      BigInt(userId),
      dto.points,
      dto.adjustmentKey,
    );
  }
}