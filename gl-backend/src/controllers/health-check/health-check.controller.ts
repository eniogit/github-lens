import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthCheckController {
  @Get()
  healthCheck() {
    return { status: 'ok' };
  }
}
