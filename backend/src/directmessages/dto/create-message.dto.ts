import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDirectMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(280, { message: 'Message content must not exceed 280 characters.' })
  content: string;
}