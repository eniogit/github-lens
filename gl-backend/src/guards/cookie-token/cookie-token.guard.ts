import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from 'src/auth/auth';

declare module 'express' {
  interface Request {
    email: string;
  }
}

@Injectable()
export class CookieTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const cookie = request.cookies['token'] as string;
    try {
      request.email = await this.authService.verifyJwt(cookie);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }
}
