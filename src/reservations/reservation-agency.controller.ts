import { Body, Controller, Post, Req, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiCreatedResponse, ApiInternalServerErrorResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { StatsdService } from 'src/statsd/statsd.service';
import { ReservationAgencyService } from './reservation-agency.service';
import { HttPStatusResponse } from 'src/pnr/responsesDto/http-status.dto';
import { GetExtrasResponse } from './responsesDto/get-extras.dto';
import { ReservationResponseDto } from './responsesDto/get-reservation.dto';
import { GetReservationsResponseDto } from './responsesDto/get-reservations.dto';
import { ReservationSeatResponse } from './responsesDto/seats.dto';
import { RetrieveReservationsAgencyDto } from './dto/get-reservations-agency.dto';
import { GetReservationAgencyDto } from './dto/get-reservation-agency.dto';
import {
  GetExtrasAgencyDto,
  GetReservationExtrasAgencyDto,
  GetReservationExtrasForSeatsAgencyDto,
} from './dto/get-reservation-extras-agency.dto';

@UseInterceptors(SentryInterceptor)
@ApiTags('Reservation-Agency')
@Controller('reservation-agency')
export class ReservationAgencyController {
  constructor(private readonly reservationService: ReservationAgencyService, private statsdService: StatsdService) {}

  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Retrieves reservations',
    description: 'This endpoint retrieves reservations from the system.',
  })
  @ApiCreatedResponse({
    description: 'Reservations were successfully met.',
    type: [GetReservationsResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Reservation list Error.',
    type: HttPStatusResponse,
  })
  @Post('/list')
  async getReservations(
    @Body(ValidationPipe) retrieveReservationsDto: RetrieveReservationsAgencyDto
  ): Promise<GetReservationsResponseDto[]> {
    const start = Date.now();
    const response = await this.reservationService.retrieveReservations(
      retrieveReservationsDto,
      retrieveReservationsDto.token
    );
    const end = Date.now();
    await this.statsdService.timing('_reservations_getReservations_post_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Retrieves reservation detail',
    description: 'This endpoint retrieves reservation detail from the system.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Reservation Detail Error.',
    type: HttPStatusResponse,
  })
  @ApiCreatedResponse({
    description: 'Reservation successfully found.',
    type: ReservationResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('/detail')
  async getReservationDetail(
    @Req() request,
    @Body(ValidationPipe) getReservationDto: GetReservationAgencyDto
  ): Promise<ReservationResponseDto> {
    const start = Date.now();
    const response = await this.reservationService.retrieveReservation(
      getReservationDto,
      getReservationDto.token,
      true,
      'Agency'
    );
    const end = Date.now();
    await this.statsdService.timing('_reservations_getReservation_detail_post_response_time', end - start);
    return response;
  }

  @ApiInternalServerErrorResponse({
    description: 'Reservation extras Error.',
    type: HttPStatusResponse,
  })
  @ApiCreatedResponse({
    description: 'Reservation extras detail were successfully met.',
    type: GetExtrasResponse,
  })
  @ApiOperation({
    summary: 'Retrieves extras of the reservation',
    description: 'This endpoint retrieve extras detail from the system.',
  })
  @Post('/detail/extras')
  async getReservationExtras(@Body(ValidationPipe) getReservationDto: GetReservationExtrasAgencyDto) {
    const start = Date.now();
    const response = await this.reservationService.getReservationExtras(
      getReservationDto,
      getReservationDto.token,
      'Agency'
    );
    const end = Date.now();
    await this.statsdService.timing('_reservations_getExtras_post_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Retrieves extras of the reservation process',
    description: 'This endpoint retrieve extras of the reservation process from the system.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Extras Error.',
    type: HttPStatusResponse,
  })
  @ApiCreatedResponse({
    description: 'Reservation were successfully met.',
    type: GetExtrasResponse,
  })
  @Post('/extras')
  async getExtras(@Body(ValidationPipe) getReservationDto: GetExtrasAgencyDto): Promise<GetExtrasResponse> {
    const start = Date.now();
    const response = await this.reservationService.getExtras(getReservationDto, getReservationDto.token, 'Agency');
    const end = Date.now();
    await this.statsdService.timing('_reservations_getExtras_post_response_time', end - start);

    return response;
  }

  @ApiCreatedResponse({
    description: 'Reservation seats were successfully met.',
    type: ReservationSeatResponse,
  })
  @ApiOperation({
    summary: 'Retrieves seats of the flights',
    description: 'This endpoint retrieves seats of the reservation process from the system.',
  })
  @Post('/seats')
  async seats(
    @Body(ValidationPipe) getReservationDto: GetReservationExtrasForSeatsAgencyDto
  ): Promise<ReservationSeatResponse> {
    return this.reservationService.seats(getReservationDto);
  }
}
