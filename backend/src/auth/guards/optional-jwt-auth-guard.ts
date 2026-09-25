import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, _info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    // La lecture d'un profil PUBLIC reste possible sans connexion.
    if (!authorization) return null;

    // Un jeton expiré doit produire 401 pour que le client HTTP le renouvelle.
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }

    return user;
  }
}