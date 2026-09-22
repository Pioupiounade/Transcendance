import { IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsNumber, IsInt } from 'class-validator';

export class CreateOrganizationDto {
  @IsString() // doit etre une chaine de caractere
  title!: string;

  @IsString() // doit etre une chaine de caractere
  description!: string;

  @IsString() // doit etre une chaine de caractere
  address!: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  location!: number[];
}