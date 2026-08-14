//Quelles donnees sont acceptees pour MODIFIER une organisation
import { IsString, IsOptional, IsArray, ArrayMinSize, ArrayMaxSize, IsNumber } from 'class-validator';

export class UpdateOrganizationDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()    
    description?: string;

    @IsOptional()
    @IsString()  
    address?: string;

    @IsOptional()
    @IsArray()
    @ArrayMinSize(2)
    @ArrayMaxSize(2)
    @IsNumber({}, {each: true})
    location?: number[];
}