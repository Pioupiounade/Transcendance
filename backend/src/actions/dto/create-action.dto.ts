import { IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsNumber, IsInt, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { Category } from '../../../generated/prisma/client';

export class CreateActionDto {
  @IsString() // doit etre une chaine de caractere
  title!: string;

  @IsString() // doit etre une chaine de caractere
  description!: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  location!: number[];

  @IsOptional()
  @IsInt()
  organization_id?: number;

  @IsEnum(Category)
  category!: Category;

  @IsOptional()
  @IsArray()
  @IsString({ each:true })
  imagesList?: string[];

  @IsOptional()
  @IsInt()
  max_participants?: number;

  @IsDateString()
  scheduled_at!: string;
}