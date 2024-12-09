import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { FareDetailDto } from './fare-detail.dto';
import { FareQuoteDto } from './fare-quote.dto';

export class FareQuoteAgencyDto {
  // define constructor
  constructor(currencyCode: string, promotionalCode: string, fares: FareDetailDto[]) {
    this.currencyCode = currencyCode;
    this.promotionalCode = promotionalCode;
    this.fares = fares;
  }
  @ApiProperty()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsNotEmpty()
  iata: string;

  @ApiProperty({ example: 'EUR' })
  @IsString()
  @MaxLength(10)
  @IsNotEmpty()
  currencyCode: string;

  @ApiProperty()
  @IsString()
  @IsDateString()
  @IsOptional()
  date: string;

  @ApiProperty({ example: 'IBERODAYS' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  promotionalCode: string;

  @ApiProperty({ type: FareDetailDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => FareDetailDto)
  @ArrayMinSize(1)
  fares: FareDetailDto[];

  public generateRoundTRipFareQuoteDto() {
    const currentFares = this.fares;

    const newFare = new FareDetailDto(
      currentFares[0].originCode,
      currentFares[0].destinationCode,
      currentFares[0].departureDate,
      currentFares[0].arrivalDate,
      currentFares[0].languageCode,
      currentFares[0].numberOfDaysAfter,
      currentFares[0].numberOfDaysBefore,
      currentFares[0].show,
      currentFares[0].passengers
    );
    newFare.originCode = currentFares[0].destinationCode;
    newFare.destinationCode = currentFares[0].originCode;

    this.fares = [...currentFares, newFare];

    return new FareQuoteDto(this.currencyCode, this.promotionalCode, this.fares);
  }
}
