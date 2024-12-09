import { Req, Body, Controller, Post, ValidationPipe, UsePipes, UseInterceptors } from '@nestjs/common';
import { GetExtrasDto, GetReservationDto, GetReservationExtrasDto, GetReservationExtrasForSeatsDto } from './dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RetrieveReservationsDto } from './dto/get-reservations.dto';
import { ReservationService } from './reservation.service';
import { StatsdService } from 'src/statsd/statsd.service';
import { ReservationResponseDto } from './responsesDto/get-reservation.dto';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { GetReservationsResponseDto } from './responsesDto/get-reservations.dto';
import { GetExtrasResponse } from './responsesDto/get-extras.dto';
import { HttPStatusResponse } from 'src/pnr/responsesDto/http-status.dto';
import { ReservationSeatResponse } from './responsesDto/seats.dto';

@UseInterceptors(SentryInterceptor)
@ApiBearerAuth()
@ApiTags('Reservation')
@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService, private statsdService: StatsdService) {}

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
    @Req() request,
    @Body(ValidationPipe) retrieveReservationsDto: RetrieveReservationsDto
  ): Promise<GetReservationsResponseDto[]> {
    const start = Date.now();
    const response = await this.reservationService.retrieveReservations(
      retrieveReservationsDto,
      request.headers.authorization
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
    @Body(ValidationPipe) getReservationDto: GetReservationDto
  ): Promise<ReservationResponseDto> {
    const start = Date.now();
    const response = await this.reservationService.retrieveReservation(
      getReservationDto,
      request.headers.authorization,
      true,
      request.user
    );
    const end = Date.now();
    await this.statsdService.timing('_reservations_getReservation_detail_post_response_time', end - start);
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
  @Post('/detail/extrasSummary')
  async getReservationDetailExtrasSummary(
    @Req() request,
    @Body(ValidationPipe) getReservationDto: GetReservationDto
  ): Promise<ReservationResponseDto> {
    const start = Date.now();
    const response = await this.reservationService.retrieveReservationExtrasSummary(
      getReservationDto,
      request.headers.authorization,
      true,
      request.user
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
  async getReservationExtras(@Req() request, @Body(ValidationPipe) getReservationDto: GetReservationExtrasDto) {
    const start = Date.now();
    const response = await this.reservationService.getReservationExtras(
      getReservationDto,
      request.headers.authorization,
      request.user
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
  async getExtras(@Req() request, @Body(ValidationPipe) getReservationDto: GetExtrasDto): Promise<GetExtrasResponse> {
    const start = Date.now();
    const response = await this.reservationService.getExtras(
      getReservationDto,
      request.headers.authorization,
      request.user
    );
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
    @Body(ValidationPipe) getReservationDto: GetReservationExtrasForSeatsDto
  ): Promise<ReservationSeatResponse> {
    return this.reservationService.seats(getReservationDto);
  }
}
