import { Body, Controller, HttpCode, Post, Req, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { FareQuotesService } from './fare-quotes.service';
import { FareQuoteDto } from './dto/fare-quote.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FareQuoteDetailsDto } from './dto/fare-quote-details.dto';
import { StatsdService } from 'src/statsd/statsd.service';
import { JsonLogger } from 'src/utils/json-logger';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { GetFareQuoteResponse } from './responsesDto/get_fare_quote.dto';
import { FareQuoteDetailResponse } from './responsesDto/get_fare_quote_details.dto';
import { HttPStatusResponse } from 'src/pnr/responsesDto/http-status.dto';
import { FareQuotePublicDto } from './dto/fare-quote-publi.dto';

@UseInterceptors(SentryInterceptor)
@ApiTags('Reservation')
@ApiBearerAuth()
@Controller('fare-quote')
export class FareQuotesController {
  private logger = new JsonLogger(FareQuotesController.name);
  constructor(private readonly fareQuotesService: FareQuotesService, private statsdService: StatsdService) {}

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
  async getFareQuote(
    @Req() request,
    @Body(ValidationPipe) getFareQuoteDto: FareQuoteDto
  ): Promise<GetFareQuoteResponse[]> {
    const start = Date.now();
    const response = await this.fareQuotesService.getFareQuoteRemote(
      getFareQuoteDto,
      request.headers.authorization,
      request.user
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
  async getFareQuoteDetails(@Req() request, @Body(ValidationPipe) getFareQuoteDto: FareQuoteDetailsDto): Promise<any> {
    const start = Date.now();
    const response = await this.fareQuotesService.getFareQuoteRemote(
      getFareQuoteDto,
      request.headers.authorization,
      request.user
    );
    const end = Date.now();
    await this.statsdService.timing('_fare-quotes_getFareQuote_details_post_response_time', end - start);
    return response;
  }

  @Post('/public')
  @ApiOperation({
    summary: 'Retrieves fare quotes',
    description: 'This endpoint retrieves fare quotes from the system from departuredate to one year.',
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
  async getPublicFareQuote(
    @Req() request,
    @Body(ValidationPipe) getFareQuoteDto: FareQuotePublicDto
  ): Promise<GetFareQuoteResponse[]> {
    const start = Date.now();
    const response = await this.fareQuotesService.getFareQuotePublicRemote(getFareQuoteDto);
    const end = Date.now();
    await this.statsdService.timing(
      getFareQuoteDto.date ? '_fare_quote_public_post_response_time' : '_fare_quote_public_post_response_time',
      end - start
    );
    return response;
  }


  
  @Post('/show')
  @ApiOperation({
    summary: 'Retrieves fare quote details',
    description: 'This endpoint retrieves fare quote details from the system.',
  })
  @ApiCreatedResponse({
    description: 'FareQuote detail successfully found.',
    type: [FareQuoteDetailResponse],
  })
  @ApiInternalServerErrorResponse({
    description: 'FareQuote detail Error.',
    type: HttPStatusResponse,
  })
  @HttpCode(200)
  async getFareQuoteShow(@Req() request, @Body(ValidationPipe) getFareQuoteDto: FareQuoteDetailsDto): Promise<any> {
    const start = Date.now();
    const response = await this.fareQuotesService.getFareQuoteShow(
      getFareQuoteDto,
      request.headers.authorization,
      request.user
    );
    const end = Date.now();
    await this.statsdService.timing('_fare-quotes_getFareQuote_details_post_response_time', end - start);
    return response;
  }
}
