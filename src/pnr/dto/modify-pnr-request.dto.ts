import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Passenger } from '../interfaces/passenger';
import { ReservationDto } from './reservation.dto';

export class UpdatePassengersInfoRequestDto extends ReservationDto {
  @ApiProperty()
  @IsNotEmpty()
  passengers: Passenger[];
}
