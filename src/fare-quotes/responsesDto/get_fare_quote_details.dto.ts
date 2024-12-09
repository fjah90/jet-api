import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsNotEmptyObject, ValidateNested, IsArray } from 'class-validator';

export class FareType {
  @ApiProperty({ description: 'Unique identifier for the fare type' })
  @IsString()
  @IsNotEmpty()
  fareTypeID: string;

  @ApiProperty({ description: 'Name of the fare type' })
  @IsString()
  @IsNotEmpty()
  fareTypeName: string;

  @ApiProperty({ description: 'Lowest fare price with tax' })
  @IsNumber()
  @IsNotEmpty()
  lowestFarePriceWithTax: number;

  @ApiProperty({ description: 'Unique identifier for the fare' })
  @IsString()
  @IsNotEmpty()
  fareID: string;

  @ApiProperty({ description: 'FBCode' })
  @IsString()
  FBCode: string;

  @ApiProperty({ description: 'FCCode' })
  @IsString()
  FCCode: string;

  @ApiProperty({ description: 'Bundle code' })
  bundleCode: string | null;
}

export class Leg {
  @ApiProperty({ description: 'Unique identifier for the leg' })
  @IsString()
  @IsNotEmpty()
  PFID: string;

  @ApiProperty({ description: 'Departure date and time of the leg' })
  @IsString()
  @IsNotEmpty()
  departureDate: string;

  @ApiProperty({ description: 'Origin of the leg' })
  @IsString()
  @IsNotEmpty()
  origin: string;

  @ApiProperty({ description: 'Destination of the leg' })
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty({ description: 'Flight number' })
  @IsString()
  @IsNotEmpty()
  flightNum: string;

  @ApiProperty({ description: 'Indicates if the flight is international' })
  @IsBoolean()
  international: boolean;

  @ApiProperty({ description: 'Arrival date and time of the leg' })
  @IsString()
  @IsNotEmpty()
  arrivalDate: string;

  @ApiProperty({ description: 'Duration of the flight in minutes' })
  @IsString()
  @IsNotEmpty()
  flightTime: string;

  @ApiProperty({ description: 'Operating carrier' })
  @IsString()
  operatingCarrier: string;

  @ApiProperty({ description: 'From terminal' })
  fromTerminal: string | null;

  @ApiProperty({ description: 'To terminal' })
  toTerminal: string | null;

  @ApiProperty({ description: 'Aircraft type' })
  @IsString()
  @IsNotEmpty()
  aircraftType: string;

  @ApiProperty({ description: 'aircraftDescription' })
  @IsString()
  @IsNotEmpty()
  aircraftDescription: string;

  @ApiProperty({ description: 'deiDisclosure' })
  @IsString()
  @IsNotEmpty()
  deiDisclosure: string;

  @ApiProperty({ description: 'aircraftLayoutName' })
  @IsString()
  @IsNotEmpty()
  aircraftLayoutName: string;

  @ApiProperty({ description: 'serviceType' })
  @IsString()
  @IsNotEmpty()
  serviceType: string;

  @ApiProperty({ description: 'nonStopLogicalFlightId' })
  @IsString()
  @IsNotEmpty()
  nonStopLogicalFlightId: string;
}

export class FareQuoteDetailResponse {
  @ApiProperty({ description: 'Unique identifier for the fare' })
  @IsString()
  @IsNotEmpty()
  LFID: string;

  @ApiProperty({ description: 'Array of FareTypes', type: () => [FareType] })
  @IsArray()
  @Type(() => FareType)
  @IsNotEmpty()
  fareTypes: FareType[];

  @ApiProperty({ description: 'Array of Legs', type: () => [Leg] })
  @IsArray()
  @Type(() => Leg)
  @IsNotEmpty()
  legs: Leg[];
}
