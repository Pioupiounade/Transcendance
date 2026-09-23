import { IsNumberString } from 'class-validator';

export class SendFriendRequestDto {
  @IsNumberString()
  addressee_id!: string;
}