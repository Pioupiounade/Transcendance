//Quelles donnees sont acceptees pour MODIFIER un utilisateur

import { IsEmail, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;
}