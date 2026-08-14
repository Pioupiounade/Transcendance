//Quelles donnees sont acceptees pour MODIFIER une action
import { IsString, IsOptional, IsArray, ArrayMinSize, ArrayMaxSize, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { Category } from '../../generated/prisma/client';

export class UpdateActionDto {
  @IsOptional()
  @IsString() // doit etre une chaine de caractere
  title?: string;

  @IsOptional()
  @IsString() // doit etre une chaine de caractere
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  location?: number[];

  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @IsOptional()
  @IsArray()
  @IsString({ each:true })
  imagesList?: string[];

  @IsOptional()
  @IsDateString()
  scheduled_at?: string;
}