import { IsEnum } from 'class-validator';
import { InterestCategory } from '../../../generated/prisma/client';

export class SelectInterestDto {
  @IsEnum(InterestCategory)
  interest!: InterestCategory;
}