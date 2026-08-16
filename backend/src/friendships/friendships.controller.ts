import { Controller, Get, Patch, Delete, Query, Param } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';

@Controller('friendships')
export class FriendshipsController {
    constructor(private friendshipsService: FriendshipsService) {}

    @Get('me')
    findMyFriends(
        @Query('current_user_id') currentUserId: string,
    ) {
        return this.friendshipsService.findMyFriends(currentUserId);
    }

    @Get('me/blocked')
    findBlockedFriends(
        @Query('current_user_id') currentUserId: string,
    ) {
        return this.friendshipsService.findBlockedFriends(currentUserId);
    }

    @Patch(':friendUserId/block')
    blockFriend(
        @Param('friendUserId') friendUserId: string,
        @Query('current_user_id') currentUserId: string,
    ) {
        return this.friendshipsService.blockFriend(currentUserId, friendUserId);
    }

    @Patch(':friendUserId/unblock')
    unblockFriend(
        @Param('friendUserId') friendUserId: string,
        @Query('current_user_id') currentUserId: string,
    ) {
          return this.friendshipsService.unblockFriend(currentUserId, friendUserId);
    }

    @Delete(':friendUserId')
    removeFriend(
        @Param('friendUserId') friendUserId: string,
        @Query('current_user_id') currentUserId: string,
    ) {
          return this.friendshipsService.removeFriend(currentUserId, friendUserId);
    }
}
