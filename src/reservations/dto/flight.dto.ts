import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsEnum,
  IsOptional,
  MaxLength,
  IsAlphanumeric,
  IsAlpha,
  IsDateString,
} from 'class-validator';
import { Fares } from '../entities';

export class FlightDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  @IsAlpha()
  airportCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  departureDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  @IsAlpha()
  destinationAirportCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  logicalFlightID: string;

  @ApiProperty({
    enum: Fares,
    isArray: false,
    example: Fares.BASIC,
  })
  @IsEnum(Fares)
  @IsNotEmpty()
  fare: Fares;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  touristPlus: boolean;
}

export class FlightOfReservationDto extends OmitType(FlightDto, ['fare', 'touristPlus'] as const) {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(10)
  @IsAlphanumeric()
  serviceBundle: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(10)
  @IsAlphanumeric()
  fareBundle: string;

  @ApiProperty()
  @IsString()
  @MaxLength(10)
  @IsAlphanumeric()
  fareBasisCode: string;

  @ApiProperty()
  @IsString()
  @MaxLength(10)
  @IsAlphanumeric()
  fareClassCode: string;
}
