import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserStatus } from '../../../entities/user.entity';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Usuario desactivado. Acceso denegado.');
    }

    return true;
  }
}
