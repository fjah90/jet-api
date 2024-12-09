import { ApiProperty } from '@nestjsx/crud/lib/crud';
import { IsBoolean, IsString } from 'class-validator';

class PassengerSeat {
  @ApiProperty()
  @IsBoolean()
  hasIncludedSeat: boolean;

  @ApiProperty()
  @IsBoolean()
  selectionObligatory: boolean;

  @ApiProperty()
  @IsString()
  key: string;
}

class ReservationSeatFlight {
  @ApiProperty()
  @IsString()
  logicalFlightID: string;

  @ApiProperty({ type: () => [PassengerSeat] })
  @IsString()
  passengers: PassengerSeat[];
}

export class ReservationSeatResponse {
  @ApiProperty({ type: () => [ReservationSeatFlight] })
  @IsString()
  flights: ReservationSeatFlight[];
}
