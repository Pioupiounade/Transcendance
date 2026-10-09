import { Controller, Get, Patch, Delete, Query, Param, Req, UseGuards } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';


@Controller('friendships')
export class FriendshipsController {
    constructor(private friendshipsService: FriendshipsService) {}

    @UseGuards(JwtAuthGuard)
    @Get('me')
    findMyFriends(
    @Req() req: any,
    ) {
    return this.friendshipsService.findMyFriends(
        req.user.id,
    );
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/blocked')
    findBlockedFriends(
    @Req() req: any,
    ) {
    return this.friendshipsService.findBlockedFriends(
        req.user.id,
    );
    }

    @UseGuards(JwtAuthGuard)
    @Get(':friendUserId/status')
    getFriendshipStatus(
    @Req() req: any,
    @Param('friendUserId') friendUserId: string,
    ) {
    return this.friendshipsService.getFriendshipStatus(
        req.user.id,
        friendUserId,
    );
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':friendUserId/block')
    blockFriend(
    @Req() req: any,
    @Param('friendUserId') friendUserId: string,
    ) {
    return this.friendshipsService.blockFriend(
        req.user.id,
        friendUserId,
    );
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':friendUserId/unblock')
    unblockFriend(
    @Req() req: any,
    @Param('friendUserId') friendUserId: string,
    ) {
    return this.friendshipsService.unblockFriend(
        req.user.id,
        friendUserId,
    );
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':friendUserId')
    removeFriend(
    @Req() req: any,
    @Param('friendUserId') friendUserId: string,
    ) {
    return this.friendshipsService.removeFriend(
        req.user.id,
        friendUserId,
    );
    }
}
