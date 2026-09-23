import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1024, { message: 'Comment must not exceed 1024 characters' })
  content: string;
}