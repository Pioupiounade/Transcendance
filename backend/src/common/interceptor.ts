import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as fs from 'fs';

@Injectable()
export class DeleteFileOnErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        const request = context.switchToHttp().getRequest();
        const file = request.file;

        // Si Multer a créé un fichier mais qu'une erreur a été levée ensuite
        if (file && file.path) {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) {
              console.error(`Failed to delete orphan file: ${file.path}`, unlinkErr);
            }
          });
        }

        return throwError(() => err);
      }),
    );
  }
}