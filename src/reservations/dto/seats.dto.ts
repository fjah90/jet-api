import { OmitType } from '@nestjs/swagger';
import { GetReservationExtrasForSeatsDto } from './get-reservation-extras.dto';

export class SeatsDto extends OmitType(GetReservationExtrasForSeatsDto, ['lang'] as const) {}
