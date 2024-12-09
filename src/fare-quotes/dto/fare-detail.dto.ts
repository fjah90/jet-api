import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
  MaxLength,
  IsDateString,
  MinLength,
} from 'class-validator';
import { PassengerByTypeDto } from './passenger-by-type.dto';

export class FareDetailDto {
  constructor(
    originCode: string,
    destinationCode: string,
    departureDate: string,
    arrivalDate: string,
    languageCode: string,
    numberOfDaysAfter: number,
    numberOfDaysBefore: number,
    show: boolean,
    passengers: PassengerByTypeDto[],
    fareBasisCode = '',
    fareClassCode = ''
  ) {
    this.originCode = originCode;
    this.destinationCode = destinationCode;
    this.departureDate = departureDate;
    this.arrivalDate = arrivalDate;
    this.languageCode = languageCode;
    this.numberOfDaysAfter = numberOfDaysAfter;
    this.numberOfDaysBefore = numberOfDaysBefore;
    this.show = show;
    this.passengers = passengers;
    this.fareBasisCode = fareBasisCode;
    this.fareClassCode = fareClassCode;
  }

  @ApiProperty({ example: 'MAD' })
  @IsString()
  @MaxLength(3)
  @IsNotEmpty()
  originCode: string;

  @ApiProperty({ example: 'SJO' })
  @IsString()
  @MaxLength(3)
  @IsNotEmpty()
  destinationCode: string;

  @ApiProperty({ example: '2023-04-23' })
  @IsString()
  @IsDateString()
  @IsNotEmpty()
  departureDate: string;

  @ApiProperty({ example: '2023-04-27' })
  @IsString()
  @IsDateString()
  @IsOptional()
  arrivalDate: string;

  @ApiProperty({ example: 'ES' })
  @IsString()
  languageCode: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsOptional()
  numberOfDaysAfter: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  show: boolean;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsOptional()
  numberOfDaysBefore: number;

  @ApiProperty({ type: [PassengerByTypeDto], isArray: true, example: ['passengerTypeID:1', 'totalSeatsRequired:1'] })
  @Type(() => PassengerByTypeDto)
  @ArrayMinSize(1)
  passengers: PassengerByTypeDto[];

  @ApiProperty({ example: '1BO' })
  @ApiProperty()
  @MaxLength(10)
  @IsString()
  fareBasisCode: string;

  @ApiProperty({ example: 'Z' })
  @ApiProperty()
  @IsString()
  @MaxLength(10)
  fareClassCode: string;

  public toXml() {
    if (this.isDateRange()) {
      return {
        'rad1:FareQuoteDetailDateRange': {
          'rad1:Origin': this.originCode,
          'rad1:Destination': this.destinationCode,
          'rad1:UseAirportsNotMetroGroups': 'true',
          'rad1:UseAirportsNotMetroGroupsAsRule': 'true',
          'rad1:UseAirportsNotMetroGroupsForFrom': 'true',
          'rad1:UseAirportsNotMetroGroupsForTo': 'true',
          'rad1:DateOfDepartureStart': this.departureDate,
          'rad1:DateOfDepartureEnd': this.arrivalDate,
          'rad1:FareTypeCategory': '1',
          'rad1:FareClass': this.fareClassCode,
          'rad1:FareBasisCode': this.fareBasisCode,
          'rad1:Cabin': '',
          'rad1:LFID': '0',
          'rad1:OperatingCarrierCode': '',
          'rad1:MarketingCarrierCode': '',
          'rad1:LanguageCode': this.languageCode,
          'rad1:TicketPackageID': '',
          'rad1:FareQuoteRequestInfos': this.passengers.map((passenger) => ({
            'rad1:FareQuoteRequestInfo': {
              'rad1:PassengerTypeID': passenger.passengerTypeID,
              'rad1:TotalSeatsRequired': passenger.totalSeatsRequired,
            },
          })),
        },
      };
    } else {
   
      return {
        'rad1:FareQuoteDetail': {
          'rad1:Origin': this.originCode,
          'rad1:Destination': this.destinationCode,
          'rad1:UseAirportsNotMetroGroups': 'true',
          'rad1:UseAirportsNotMetroGroupsAsRule': 'true',
          'rad1:UseAirportsNotMetroGroupsForFrom': 'true',
          'rad1:UseAirportsNotMetroGroupsForTo': 'true',
          'rad1:DateOfDeparture': this.departureDate,
          'rad1:FareTypeCategory': '1',
          'rad1:FareClass': this.fareClassCode,
          'rad1:FareBasisCode': this.fareBasisCode,
          'rad1:Cabin': '',
          'rad1:LFID': '0',
          'rad1:OperatingCarrierCode': '',
          'rad1:MarketingCarrierCode': '',
          'rad1:NumberOfDaysBefore': this.numberOfDaysBefore,
          'rad1:NumberOfDaysAfter': this.numberOfDaysAfter,
          'rad1:LanguageCode': this.languageCode,
          'rad1:TicketPackageID': '',
          'rad1:FareQuoteRequestInfos': this.passengers.map((passenger) => ({
            'rad1:FareQuoteRequestInfo': {
              'rad1:PassengerTypeID': passenger.passengerTypeID,
              'rad1:TotalSeatsRequired': passenger.totalSeatsRequired,
            },
          })),
        },
      };
    }
  }

  public revertOriginAndDestination() {
    const temp = this.originCode;
    this.originCode = this.destinationCode;
    this.destinationCode = temp;
    return this;
  }

  public isDateRange(): boolean {
    return this.numberOfDaysAfter == null || (this.numberOfDaysBefore == null && this.arrivalDate != null);
  }
}
