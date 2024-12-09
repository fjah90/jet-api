import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsAlphanumeric, IsAlpha, MaxLength } from 'class-validator';
import { GetDocumentByLanguageDto } from 'src/prismic/dto';
import { FlightDto, FlightOfReservationDto } from './flight.dto';
import { PassengerReservationDto } from '.';
import { Transform } from 'class-transformer';

export class GetReservationExtrasForSeatsAgencyDto extends GetDocumentByLanguageDto {
  @ApiProperty()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  currency: string;

  @ApiProperty()
  @IsNotEmpty()
  passengers: string[];

  @ApiProperty({ type: () => [FlightDto] })
  @IsNotEmpty()
  flights: FlightDto[];
}

export class GetReservationExtrasAgencyDto extends GetDocumentByLanguageDto {
  @ApiProperty()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  @IsAlpha()
  currency: string;

  @ApiProperty({
    description: 'Confirmation code to track flight',
    example: 'XF49GB',
  })
  @IsString()
  @IsNotEmpty()
  @Transform((params) => params.value.toUpperCase())
  @MaxLength(6)
  @IsAlphanumeric()
  confirmationNumber: string;
}

export class GetExtrasAgencyDto extends GetDocumentByLanguageDto {
  @ApiProperty()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  currency: string;

  @ApiProperty({ type: () => [PassengerReservationDto] })
  @IsNotEmpty()
  passengers: PassengerReservationDto[];

  @ApiProperty({ type: () => [FlightOfReservationDto] })
  @IsNotEmpty()
  flights: FlightOfReservationDto[];
}
