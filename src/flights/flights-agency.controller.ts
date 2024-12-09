import { Body, Req, Controller, Post, ValidationPipe, UseInterceptors } from '@nestjs/common';
import { ApiCreatedResponse, ApiInternalServerErrorResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsdService } from 'src/statsd/statsd.service';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { OriginAndDestinationsResponse } from './responsesDto/get_all_flights.dto';
import { HttPStatusResponse } from 'src/pnr/responsesDto/http-status.dto';
import { FlightsAgencyService } from './flights-agency.service';
import { GetAllFlightAgencyRequest } from './responsesDto/get_all_flight_agency.request';

@UseInterceptors(SentryInterceptor)
@ApiTags('Flights-Agency')
@Controller('flights-agency')
export class FlightsAgencyController {
  constructor(private readonly flightsService: FlightsAgencyService, private statsdService: StatsdService) {}

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
    @Body(ValidationPipe) getAllFlightAgencyRequest: GetAllFlightAgencyRequest
  ): Promise<OriginAndDestinationsResponse[]> {
    const start = Date.now();
    const response = await this.flightsService.retrieveAllFlights(getAllFlightAgencyRequest, 'Agency');
    const end = Date.now();
    await this.statsdService.timing('_flights_getAllFlights_post_response_time', end - start);
    return response;
  }
}
