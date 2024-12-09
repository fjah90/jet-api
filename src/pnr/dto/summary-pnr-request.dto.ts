import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { AddressDto } from './address.dto';
import { ContactDto } from './contact.dto';
import { PassengerApiInfoDto, PassengerDto } from './passenger.dto';
import { ReservationDto } from './reservation.dto';
import { SegmentDto } from './segment.dto';

export class SummaryPnrRequest {
  @ApiProperty()
  @IsOptional()
  @Type(() => ReservationDto)
  reservationInfo: ReservationDto = new ReservationDto({
    seriesNumber: '299',
    confirmationNumber: 'exam',
  });

  @ApiProperty()
  @IsString()
  @MaxLength(6)
  carrierCurrency: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  displayCurrency: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  lang: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  receiptLanguageID: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  promoCode: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto = new AddressDto({
    address1: '',
    address2: '',
    city: '',
    state: 'N',
    postal: '',
    country: '0',
    countryCode: '',
    areaCode: '',
    phoneNumber: '+46701497931',
    display: '',
  });

  @ApiProperty({ type: () => [ContactDto] })
  @IsArray()
  @Type(() => ContactDto)
  contacts: ContactDto[];

  @ApiProperty({ type: () => [PassengerDto] })
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers: PassengerDto[];

  @ApiProperty({ type: () => [SegmentDto] })
  @ValidateNested({ each: true })
  @Type(() => SegmentDto)
  segments: SegmentDto[];
}

export class UpdatePassengerInfoDto extends ReservationDto {
  @ApiProperty({ type: () => [PassengerApiInfoDto] })
  @ValidateNested({ each: true })
  @Type(() => PassengerApiInfoDto)
  passengers: PassengerApiInfoDto[];
}
