import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsArray, isNotEmpty } from 'class-validator';
import { Currencies, Languages } from '../entities/enum';

export class GetSecurityQuestionDto {
  @ApiProperty({
    description: 'The language of the response',
    enum: Languages,
    isArray: false,
    example: Languages['ES-ES'],
  })
  @IsNotEmpty()
  @IsEnum(Languages)
  lang: Languages;
}

export class GetSecurityQuestionPayloadDto extends PartialType(GetSecurityQuestionDto) {
  @ApiProperty()
  @IsNotEmpty()
  id: number;
}

export class GetDocumentByLanguageDto extends PartialType(GetSecurityQuestionDto) {}

export class GetPrismicSeatsDto extends PartialType(GetSecurityQuestionDto) {
  @ApiProperty()
  @IsArray()
  seatCodes: string[];
}

export class GetTouristInfoDto extends PartialType(GetSecurityQuestionDto) {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  departureDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  logicalFlightID: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  airportCode: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  destinationAirportCode: string;

  @ApiProperty({
    enum: Currencies,
    isArray: false,
    example: Currencies['EUR'],
  })
  @IsNotEmpty()
  @IsEnum(Currencies)
  currency: Currencies;

  @ApiProperty({ description: 'Adult = 1, child = 6, infant = 5 ', example: [1] })
  @IsNotEmpty()
  passengerTypeID: string[];
}

export class GetAARQuote extends GetTouristInfoDto {
  @ApiProperty()
  @IsString()
  fareBasisCode?: string;

  @ApiProperty()
  @IsString()
  fareClassCode?: string;
}

export class LanguageDto extends PartialType(GetSecurityQuestionDto) {}
