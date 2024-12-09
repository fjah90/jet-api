import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { GetReservationDto } from 'src/reservations/dto';

export class GetBoardingPassDto extends OmitType(GetReservationDto, ['lastName'] as const) {}
