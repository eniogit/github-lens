import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

export const Email = createParamDecorator(
  (data: string, ctx: ExecutionContext): string | undefined => {
    const request: Request = ctx.switchToHttp().getRequest();
    const email = request.email;
    if (!email) {
      throw new UnauthorizedException('Invalid token');
    }
    return email;
  },
);
