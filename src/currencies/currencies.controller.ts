import { Req, Body, Controller, Get, Post, ValidationPipe, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrenciesService } from './currencies.service';
import { ConvertCurrenciesDto } from './dto/convert-currencies.dto';
import { StatsdService } from 'src/statsd/statsd.service';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { GetCurrenciesResponse } from './responsesDto/get-currencies.dto';

@UseInterceptors(SentryInterceptor)
@ApiTags('Currencies')
@ApiBearerAuth()
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService, private statsdService: StatsdService) {}

  // @Post('/convert')
  // async convertCurrencies(@Req() request, @Body(ValidationPipe) convertCurrenciesDto: ConvertCurrenciesDto) {
  //   await this.statsdService.increment('currencies_convert_post');
  //   const start = Date.now();
  //   const response = await this.currenciesService.convertCurrencies(
  //     convertCurrenciesDto,
  //     request.headers.authorization
  //   );
  //   const end = Date.now();
  //   await this.statsdService.timing('currencies_convert_post_response_time', end - start);
  //   return response;
  // }

  @ApiOperation({
    summary: 'Gets a list of currencies.',
    description: 'Retrieves a list of all available currencies.',
  })
  @ApiCreatedResponse({
    description: 'Currencies were successfully met.',
    type: [GetCurrenciesResponse],
  })
  @Get('/')
  async getCurrencies(): Promise<GetCurrenciesResponse[]> {
    await this.statsdService.timing('_currencies_getCurrencies_get', 4000);
    const start = Date.now();
    const response = await this.currenciesService.getAvailableCurrencies();
    const end = Date.now();
    await this.statsdService.timing('_currencies_getCurrencies_get_response_time', end - start);
    return response;
  }
}
