import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from 'src/configs/configuration';

@Controller('logout')
export class LogoutController {
  constructor(private readonly config: ConfigService) {}
  @Get()
  logout(@Res() response: Response): void {
    response.clearCookie('token');
    response.redirect(this.config.config.FRONTEND_URL);
  }
}
