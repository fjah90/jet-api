import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class Person {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  personOrgID: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  middleName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  age: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dob: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  passengerTypeID: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fareBasisCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fareClassCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  passport: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nationality: string;

  @IsString()
  @IsNotEmpty()
  issueCountry: string;

  @IsString()
  @IsNotEmpty()
  residenceCountry: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  languageId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address2: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  postalCode: string;
}

class Service {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}

export class AirlinePerson {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  person: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  passengerTypeID: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  personOrgID: string;

  @ApiProperty({ type: () => [Service] })
  @IsNotEmpty()
  services: Service[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  airlinePersonKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  seat: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  oldSeat: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  checkinStatus: string;
}
export class FlightOfReservation {
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  availableToCheckIn: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  logicalFlightKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  physicalFlightID: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  physicalFlightKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  logicalFlightID: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  departureDate: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  hasDeparted: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  timeToCloseCheckIn: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  operatingCarrier: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  operatingFlightNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  origin: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  originName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destinationName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  originAirportName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destinationAirportName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destinationAirportImage: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  departureTime: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  arrivalTime: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amountOfScales: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fareBasisCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fareClassCode: string;

  @ApiProperty({ type: () => [AirlinePerson] })
  @IsNotEmpty()
  persons: AirlinePerson[];
}

export class LegOfReservation {
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  availableToCheckIn: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  logicalFlightKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  physicalFlightID: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  physicalFlightKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  logicalFlightID: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  departureDate: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  hasDeparted: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  timeToCloseCheckIn: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  operatingCarrier: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  operatingFlightNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  origin: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  originName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destinationName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  originAirportName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destinationAirportName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destinationAirportImage: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  departureTime: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  arrivalTime: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amountOfScales: number;

  @ApiProperty({ type: () => [FlightOfReservation] })
  @IsNotEmpty()
  flights?: FlightOfReservation[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fareBasisCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fareClassCode: string;
}

export class ReservationResponseDto {
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  paymentStatus: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  errorPaymentMessage: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  reservationStatus: number;

  @ApiProperty()
  @IsBoolean()
  reservationMessage: boolean;

  @ApiProperty({ type: () => [Person] })
  @IsNotEmpty()
  passengers: Person[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  confirmationNumber: string;

  @ApiProperty({ type: () => [LegOfReservation] })
  @IsNotEmpty()
  flights: LegOfReservation[];
}
