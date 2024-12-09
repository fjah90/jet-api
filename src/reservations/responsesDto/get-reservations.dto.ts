import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { ReservationResponseDto } from './get-reservation.dto';

export class Flight {
  @ApiProperty({ description: 'Indicates if the flight is available for check-in' })
  @IsBoolean()
  availableToCheckIn: boolean;

  @ApiProperty({ description: 'Operating carrier' })
  @IsString()
  @IsNotEmpty()
  operatingCarrier: string;

  @ApiProperty({ description: 'Operating flight number' })
  @IsString()
  operatingFlightNumber: string;

  @ApiProperty({ description: 'Origin of the flight' })
  @IsString()
  @IsNotEmpty()
  origin: string;

  @ApiProperty({ description: 'Name of the origin airport' })
  @IsString()
  @IsNotEmpty()
  originName: string;

  @ApiProperty({ description: 'Destination of the flight' })
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty({ description: 'Indicates if the flight has departed' })
  @IsBoolean()
  hasDeparted: boolean;

  @ApiProperty({ description: 'Name of the destination airport' })
  @IsString()
  @IsNotEmpty()
  destinationName: string;

  @ApiProperty({ description: 'Name of the origin airport' })
  @IsString()
  @IsNotEmpty()
  originAirportName: string;

  @ApiProperty({ description: 'Name of the destination airport' })
  @IsString()
  @IsNotEmpty()
  destinationAirportName: string;

  @ApiProperty({ description: 'URL to the image of the destination airport' })
  @IsString()
  @IsNotEmpty()
  destinationAirportImage: string;

  @ApiProperty({ description: 'Departure time of the flight' })
  @IsString()
  @IsNotEmpty()
  departureTime: string;

  @ApiProperty({ description: 'Arrival time of the flight' })
  @IsString()
  @IsNotEmpty()
  arrivalTime: string;

  @ApiProperty({ description: 'Number of scales during the flight' })
  @IsNumber()
  amountOfScales: number;

  @ApiProperty({ description: 'Nested array of flights', type: () => [FlightOfLeg] })
  @ValidateNested()
  flights: FlightOfLeg[];
}

export class FlightOfLeg extends OmitType(Flight, ['flights'] as const) {}

export class GetReservationsResponseDto extends PickType(ReservationResponseDto, [
  'confirmationNumber',
  'errorPaymentMessage',
  'paymentStatus',
]) {
  @ApiProperty({ description: 'Indicates if the boarding pass is available' })
  @IsBoolean()
  btnBoardingPass: boolean;

  @ApiProperty({ description: 'Indicates if the flight has departed' })
  @IsBoolean()
  hasDeparted: boolean;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  reservationStatus: number;

  @ApiProperty()
  @IsBoolean()
  reservationMessage: boolean;

  @ApiProperty({ description: 'Array of passenger IDs' })
  @IsArray()
  @IsString({ each: true })
  passengersIds: string[];

  @ApiProperty({ description: 'Check-in button status' })
  @IsNumber()
  btnCheckIn: number;

  @ApiProperty({ description: 'Array of flights', type: () => [Flight] })
  @IsArray()
  @ValidateNested()
  flights: Flight[];
}
