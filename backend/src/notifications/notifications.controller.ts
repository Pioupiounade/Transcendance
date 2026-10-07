import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { NotificationType } from '../../generated/prisma/client';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('me')
  findMine(@Req() req: any) {
    return this.notificationsService.findMine(req.user.id);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.notificationsService.markAsRead(
      id,
      req.user.id,
    );
  }

  @Patch('me/read-all')
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(
      req.user.id,
    );
  }

  @Get('preferences')
getPreferences(@Req() req: any) {
  return this.notificationsService.getPreferences(req.user.id);
}

@Patch('preferences')
updatePreference(
  @Req() req: any,
  @Body()
  body: {
    type: NotificationType;
    enabled: boolean;
  },
) {
  return this.notificationsService.updatePreference(
    req.user.id,
    body.type,
    body.enabled,
  );
}

}