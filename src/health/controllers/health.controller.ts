import { Controller, Post, UseInterceptors } from '@nestjs/common';
import { HealthService } from '../services';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetHealthResponse } from '../responsesDto/get-health-response';
import { StatsdService } from 'src/statsd/statsd.service';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';

@UseInterceptors(SentryInterceptor)
@ApiTags('Health')
@ApiBearerAuth()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService, private statsdService: StatsdService) {}

  @ApiOperation({
    summary: 'Get Radixx Health Status',
    description: 'Check the health status of the Radixx service.',
  })
  @ApiCreatedResponse({
    type: GetHealthResponse,
    description: 'Radixx Health!',
  })
  @Post('/radixx')
  async getRadixxHealthStatus(): Promise<GetHealthResponse> {
    const start = Date.now();
    const response = await this.healthService.getRadixxHealth();
    const end = Date.now();
    this.statsdService.gauge('_get_radixx_health', response.status ? 1 : 0);
    this.statsdService.timing('_radixx_health_post_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Get Prismic Health Status',
    description: 'Check the health status of the Prismic service.',
  })
  @ApiCreatedResponse({
    type: GetHealthResponse,
    description: 'Prismic Health!',
  })
  @Post('/prismic')
  async getPrismicHealthStatus(): Promise<GetHealthResponse> {
    const start = Date.now();
    const response = await this.healthService.getPrismicHealth();
    const end = Date.now();
    this.statsdService.gauge('_get_prismic_health', response.status ? 1 : 0);
    this.statsdService.timing('_prismic_health_post_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Get EPG Health Status',
    description: 'Check the health status of the EPG service.',
  })
  @ApiCreatedResponse({
    type: GetHealthResponse,
    description: 'EPG Health!',
  })
  @Post('/epg')
  async getEPGHealthStatus(): Promise<GetHealthResponse> {
    const start = Date.now();
    const response = await this.healthService.getEPGHealth();
    const end = Date.now();
    this.statsdService.gauge('_get_epg_health', response.status ? 1 : 0);
    this.statsdService.timing('_epg_health_post_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Crash the Application',
    description: 'Intentionally crash the application.',
  })
  @ApiCreatedResponse({
    description: 'Crash!',
  })
  @Post('/crash')
  async crash(): Promise<void> {
    process.exit(1);
  }
}
