import { Req, Body, Controller, HttpCode, Patch, Post, ValidationPipe, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EditSeatDto } from './dto';
import { SeatsInputDto } from './dto/seats-input.dto';
import { SeatsService } from './seats.service';
import { StatsdService } from 'src/statsd/statsd.service';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { HttPStatusResponse } from 'src/pnr/responsesDto/http-status.dto';
import { ReservationResponseDto } from 'src/reservations/responsesDto/get-reservation.dto';
import { GetSeatListResponse } from './responsesDto/seat-list.dto';

@UseInterceptors(SentryInterceptor)
@ApiTags('Seats')
@ApiBearerAuth()
@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService, private statsdService: StatsdService) {}

  // @Post('/')
  // @HttpCode(200)
  // async getSeats(@Req() request, @Body(ValidationPipe) seatsInputDto: SeatsInputDto): Promise<any> {
  //   await this.statsdService.increment('_seats_get_seats_post');
  //   const start = Date.now();
  //   const response = await this.seatsService.getSeatsRemote(seatsInputDto, request.headers.authorization);
  //   const end = Date.now();
  //   await this.statsdService.timing('_seats_getSeats_post_response_time', end - start);
  //   return response;
  // }

  @ApiOperation({
    summary: 'Get seat list for a specific flight.',
    description: 'This endpoint retrieves the list of seats for a specific flight.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Seat list Error.',
    type: HttPStatusResponse,
  })
  @ApiCreatedResponse({
    description: 'Seat list were successfully met.',
    type: GetSeatListResponse,
  })
  @Post('/list')
  @HttpCode(200)
  async getSeatList(@Req() request, @Body(ValidationPipe) seatsInputDto: SeatsInputDto): Promise<GetSeatListResponse> {
    const start = Date.now();
    const response = await this.seatsService.getSeatList(seatsInputDto, request.headers.authorization, request.user);
    const end = Date.now();
    await this.statsdService.timing('_seats_get_seat_list_response_time', end - start);
    return response;
  }

  // @Patch('/')
  // @HttpCode(200)
  // async editSeats(@Req() request, @Body(ValidationPipe) editSeatDto: EditSeatDto): Promise<any> {
  //   await this.statsdService.increment('_seats_editSeats_post');
  //   const start = Date.now();
  //   const response = await this.seatsService.editSeats(editSeatDto, request.headers.authorization);
  //   const end = Date.now();
  //   await this.statsdService.timing('_seats_editSeats_post_response_time', end - start);
  //   return response;
  // }
}
