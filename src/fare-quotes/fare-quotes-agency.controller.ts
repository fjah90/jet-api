import { Body, Controller, HttpCode, Post, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { ApiCreatedResponse, ApiInternalServerErrorResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsdService } from 'src/statsd/statsd.service';
import { JsonLogger } from 'src/utils/json-logger';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { GetFareQuoteResponse } from './responsesDto/get_fare_quote.dto';
import { FareQuoteDetailResponse } from './responsesDto/get_fare_quote_details.dto';
import { HttPStatusResponse } from 'src/pnr/responsesDto/http-status.dto';
import { FareQuotesAgencyService } from './fare-quotes-agency.service';
import { FareQuoteAgencyDto } from './dto/fare-quote-agency.dto';
import { FareQuoteDetailsAgencyDto } from './dto/fare-quote-details-agency.dto';

@UseInterceptors(SentryInterceptor)
@ApiTags('Reservation-Agency')
@Controller('fare-quote-agency')
export class FareQuotesAgencyController {
  private logger = new JsonLogger(FareQuotesAgencyController.name);
  constructor(private readonly fareQuotesService: FareQuotesAgencyService, private statsdService: StatsdService) {}

  @Post('/')
  @ApiOperation({
    summary: 'Retrieves fare quotes',
    description: 'This endpoint retrieves fare quotes from the system.',
  })
  @ApiCreatedResponse({
    description: 'FareQuotes were successfully met.',
    type: [GetFareQuoteResponse],
  })
  @ApiInternalServerErrorResponse({
    description: 'Get FareQuote Error.',
    type: HttPStatusResponse,
  })
  @HttpCode(200)
  async getFareQuote(@Body(ValidationPipe) getFareQuoteDto: FareQuoteAgencyDto): Promise<GetFareQuoteResponse[]> {
    const start = Date.now();
    const response = await this.fareQuotesService.getFareQuoteRemote(
      getFareQuoteDto,
      getFareQuoteDto.token,
      'Agency',
      getFareQuoteDto.iata
    );
    const end = Date.now();
    await this.statsdService.timing(
      getFareQuoteDto.date ? '_fare_quote_detail_post_response_time' : '_fare_quote_post_response_time',
      end - start
    );
    return response;
  }

  @ApiOperation({
    summary: 'Retrieves fare quote details',
    description: 'This endpoint retrieves fare quote details from the system.',
  })
  @Post('/details')
  @ApiCreatedResponse({
    description: 'FareQuote detail successfully found.',
    type: [FareQuoteDetailResponse],
  })
  @ApiInternalServerErrorResponse({
    description: 'FareQuote detail Error.',
    type: HttPStatusResponse,
  })
  @HttpCode(200)
  async getFareQuoteDetails(@Body(ValidationPipe) getFareQuoteDto: FareQuoteDetailsAgencyDto): Promise<any> {
    const start = Date.now();
    const response = await this.fareQuotesService.getFareQuoteRemote(
      getFareQuoteDto,
      getFareQuoteDto.token,
      'Agency',
      getFareQuoteDto.iata
    );
    const end = Date.now();
    await this.statsdService.timing('_fare-quotes_getFareQuote_details_post_response_time', end - start);
    return response;
  }
}
