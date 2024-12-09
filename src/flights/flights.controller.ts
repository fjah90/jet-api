import { Body, Req, Controller, Post, ValidationPipe, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { LanguageDto } from 'src/prismic/dto';
import { FlightsService } from './flights.service';
import { StatsdService } from 'src/statsd/statsd.service';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { OriginAndDestinationsResponse } from './responsesDto/get_all_flights.dto';
import { HttPStatusResponse } from 'src/pnr/responsesDto/http-status.dto';

@UseInterceptors(SentryInterceptor)
@ApiTags('Flights')
@ApiBearerAuth()
@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService, private statsdService: StatsdService) {}

  @Post('/')
  @ApiCreatedResponse({
    description: 'Flights were successfully met.',
    type: [OriginAndDestinationsResponse],
  })
  @ApiInternalServerErrorResponse({
    description: 'Get All flights Error.',
    type: HttPStatusResponse,
  })
  @ApiOperation({
    summary: 'Retrieves all flights',
    description: 'This endpoint retrieves all flights from the system.',
  })
  async getAllFlights(
    @Req() request,
    @Body(ValidationPipe) languageDto: LanguageDto
  ): Promise<OriginAndDestinationsResponse[]> {
    const start = Date.now();
    const response = await this.flightsService.retrieveAllFlights(
      languageDto,
      request.headers.authorization,
      request.user
    );
    const end = Date.now();
    await this.statsdService.timing('_flights_getAllFlights_post_response_time', end - start);
    return response;
  }
}
