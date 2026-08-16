import { IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsNumber, IsOptional, IsEnum} from 'class-validator';
import { ProfileVisibility } from '../../../generated/prisma/client';

export class UpdateProfileDto {
    @IsOptional()
    @IsString() // doit etre une chaine de caractere
    username?: string;

    @IsOptional()
    @IsString() // doit etre une chaine de caractere
    description?: string;

    @IsOptional()
    @IsString() // doit etre une chaine de caractere
    profile_picture?: string;

    @IsOptional()
    @IsArray()
    @ArrayMinSize(2)
    @ArrayMaxSize(2)
    @IsNumber({}, { each: true })
    location?: number[];

    @IsOptional()
    @IsEnum(ProfileVisibility)
    visibility?: ProfileVisibility;
}