import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { SeatResponse } from './seat.dto';

export class GetSeatsResponse {
  @ApiProperty({ type: () => [SeatResponse] })
  @IsNotEmpty()
  seats: SeatResponse[];
}
