import { IsIn } from 'class-validator';
import { RoleApp } from '../../../generated/prisma/client';

export class UpdateRoleDto {
  @IsIn([RoleApp.USER, RoleApp.ADMIN])
  role: 'USER' | 'ADMIN';
}