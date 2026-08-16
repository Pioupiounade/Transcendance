import { Body, Controller, Get, Patch, Query, Param } from '@nestjs/common';
import { FriendRequestsService } from './friend-requests.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@Controller('friend-requests')
export class FriendRequestsController {
    constructor(private friendRequestsService: FriendRequestsService) {}

    @Patch('me/send')
    sendFriendRequest(
    @Query('current_user_id') currentUserId: string,
    @Body() data: SendFriendRequestDto,
    ) {
          return this.friendRequestsService.sendFriendRequest(currentUserId, data);
    }

    @Patch(':requestId/accept')
    acceptFriendRequest(
    @Param('requestId') requestId: string,
    @Query('current_user_id') currentUserId: string,
    ) {
          return this.friendRequestsService.acceptFriendRequest(currentUserId, requestId);
    }

    @Patch(':requestId/reject')
    rejectFriendRequest(
    @Param('requestId') requestId: string,
    @Query('current_user_id') currentUserId: string,
    ) {
          return this.friendRequestsService.rejectFriendRequest(currentUserId, requestId);
    }

    @Get('sentRequests')
    mySentRequests(
        @Query('current_user_id') currentUserId: string,
    ) {
        return this.friendRequestsService.mySentRequests(currentUserId);
    }

    @Get('receivedRequests')
    myReceivedRequests(
        @Query('current_user_id') currentUserId: string,
    ) {
        return this.friendRequestsService.myReceivedRequests(currentUserId);
    }

}
