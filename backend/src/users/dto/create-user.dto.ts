import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail() //doit avoir le format d'une adresse mail
  email!: string;

  @IsString() // doit etre une chaine de caractere
  @MinLength(8) // doit contenir au moins 8 caracteres
  password!: string;
}