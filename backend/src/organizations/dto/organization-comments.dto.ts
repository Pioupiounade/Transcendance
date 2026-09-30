import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class OrganizationCommentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1024, { message: 'Comment must not exceed 1024 characters' })
  comment: string;
}