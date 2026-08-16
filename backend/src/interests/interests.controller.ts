import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { InterestsService } from './interests.service';
import { SelectInterestDto } from './dto/select-interest.dto';

@Controller('interests')
export class InterestsController {
    constructor(private interestsService: InterestsService) {}

  @Patch('me/select')
  selectInterest(
    @Query('current_user_id') currentUserId: string,
    @Body() data: SelectInterestDto,
  ) {
      return this.interestsService.selectInterest(currentUserId, data);
  }

  @Patch('me/remove')
  removeInterest(
    @Query('current_user_id') currentUserId: string,
    @Body() data: SelectInterestDto,
  ) {
      return this.interestsService.removeInterest(currentUserId, data);
  }

  @Get('me')
  findMyInterests(
    @Query('current_user_id') currentUserId: string) {
    return this.interestsService.findMyInterests(currentUserId);
  }
}
