import { Body, Controller, Delete, Get, Patch, Query, Param, Req, UseGuards } from '@nestjs/common';
import { FriendRequestsService } from './friend-requests.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

@Controller('friend-requests')
export class FriendRequestsController {
    constructor(private friendRequestsService: FriendRequestsService) {}

    @UseGuards(JwtAuthGuard)
    @Patch('me/send')
    sendFriendRequest(
    @Req() req: any,
    @Body() data: SendFriendRequestDto,
    ) {
    return this.friendRequestsService.sendFriendRequest(
        req.user.id,
        data,
    );
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':requestId/accept')
    acceptFriendRequest(
    @Req() req: any,
    @Param('requestId') requestId: string,
    ) {
    return this.friendRequestsService.acceptFriendRequest(
        req.user.id,
        requestId,
    );
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':requestId/reject')
    rejectFriendRequest(
    @Req() req: any,
    @Param('requestId') requestId: string,
    ) {
    return this.friendRequestsService.rejectFriendRequest(
        req.user.id,
        requestId,
    );
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':requestId')
    cancelFriendRequest(
    @Req() req: any,
    @Param('requestId') requestId: string,
    ) {
    return this.friendRequestsService.cancelFriendRequest(
        req.user.id,
        requestId,
    );
    }

    @UseGuards(JwtAuthGuard)
    @Get('sentRequests')
    mySentRequests(
    @Req() req: any,
    ) {
    return this.friendRequestsService.mySentRequests(
        req.user.id,
    );
    }

    @UseGuards(JwtAuthGuard)
    @Get('receivedRequests')
    myReceivedRequests(
    @Req() req: any,
    ) {
    return this.friendRequestsService.myReceivedRequests(
        req.user.id,
    );
    }

}
