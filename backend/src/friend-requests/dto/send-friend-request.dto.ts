import { IsInt } from 'class-validator';

export class SendFriendRequestDto {
  @IsInt()
  addressee_id!: number;
}