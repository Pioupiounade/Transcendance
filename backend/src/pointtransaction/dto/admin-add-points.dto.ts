import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AdminAddPointsDto {
  @IsInt()
  @Min(1)
  points: number;

  @IsString()
  @IsNotEmpty()
  adjustmentKey: string;
}