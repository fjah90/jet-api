import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { VersionService } from '../services';
import { AppVersionDto } from '../dto/index';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsdService } from 'src/statsd/statsd.service';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';

@UseInterceptors(SentryInterceptor)
@ApiTags('General')
@Controller('version')
@ApiBearerAuth()
export class VersionController {
  constructor(private readonly versionService: VersionService, private statsdService: StatsdService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Retrieves the application version',
    description: 'This endpoint retrieves the current version of the application.',
  })
  @ApiCreatedResponse({
    description: 'Version successfully found',
    type: AppVersionDto,
  })
  async getAppVersion(): Promise<AppVersionDto> {
    const start = Date.now();
    const response = await this.versionService.getAppVersion();
    const end = Date.now();
    await this.statsdService.timing('_version_getAppVersion_get_response_time', end - start);
    return response;
  }
}
