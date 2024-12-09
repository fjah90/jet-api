import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { PingService } from './ping.service';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { StatsdService } from 'src/statsd/statsd.service';

@UseInterceptors(SentryInterceptor)
@ApiTags('General')
@Controller('ping')
export class PingController {
  constructor(private readonly pinService: PingService, private statsdService: StatsdService) {}
  @Get('/')
  @ApiCreatedResponse({
    description: 'Ping!',
  })
  @ApiOperation({
    summary: 'Pings the server',
    description: 'This endpoint pings the server to check if it is alive.',
  })
  async getPin() {
    await this.statsdService.timing('_ping', 4000);
    const start = Date.now();

    const response = await this.pinService.getPing();
    const end = Date.now();
    await this.statsdService.timing('_ping_response_time', end - start);
    return response;
  }
}
