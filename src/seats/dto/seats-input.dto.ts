import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsAlpha, IsAlphanumeric, IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { GetDocumentByLanguageDto } from 'src/prismic/dto';
import { PassengerOfSeatListRequestDto } from 'src/reservations/dto';

export class SeatsInputDto extends GetDocumentByLanguageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  currencyCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  departureDate: string;

  @ApiProperty()
  @IsString()
  @MaxLength(3)
  @IsAlpha()
  airportCode: string;

  @ApiProperty()
  @IsString()
  @MaxLength(3)
  @IsAlpha()
  destinationAirportCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @IsAlpha()
  airportCodeLF: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  @IsAlpha()
  destinationAirportCodeLF: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  logicalFlightID: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(10)
  serviceBundle: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(10)
  fareBundle: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(10)
  fareBasisCode: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(10)
  fareClassCode: string;

  @ApiProperty({ type: () => [PassengerOfSeatListRequestDto] })
  @IsNotEmpty()
  @IsArray()
  @Type(() => PassengerOfSeatListRequestDto)
  passengers: PassengerOfSeatListRequestDto[];
}
