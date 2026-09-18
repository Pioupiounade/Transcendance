import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { InterestsService } from './interests.service';
import { SelectInterestDto } from './dto/select-interest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';


@Controller('interests')
export class InterestsController {
    constructor(private interestsService: InterestsService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('me/select')
  selectInterest(
    @Req() req: any,
    @Body() data: SelectInterestDto,
  ) {
    return this.interestsService.selectInterest(req.user.id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/remove')
  removeInterest(
    @Req() req: any,
    @Body() data: SelectInterestDto,
  ) {
    return this.interestsService.removeInterest(
      req.user.id,
      data,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMyInterests(
    @Req() req: any,
  ) {
    return this.interestsService.findMyInterests(
      req.user.id,
    );
  }
}
