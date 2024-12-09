import { ApiProperty } from '@nestjsx/crud/lib/crud/swagger.helper';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { AddressDto } from 'src/pnr/dto/address.dto';
import { ContactDto } from 'src/pnr/dto/contact.dto';

export class payor {
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  PersonOrgID: string;
  @ApiProperty()
  @IsNotEmpty()
  FirstName: string;
  @ApiProperty()
  @IsNotEmpty()
  LastName: string;
  @ApiProperty()
  @IsNotEmpty()
  MiddleName: string;
  @IsNumber()
  @ApiProperty()
  @IsNotEmpty()
  Age: number;
  @ApiProperty()
  @IsNotEmpty()
  DOB: string;
  @ApiProperty()
  @IsNotEmpty()
  Gender: string;
  @ApiProperty()
  @IsNotEmpty()
  Title: string;
  @IsNumber()
  @ApiProperty()
  @IsNotEmpty()
  NationalityLaguageID: number;
  @ApiProperty()
  @IsNotEmpty()
  RelationType: string;
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  WBCID: string;
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  PTCID: string;
  @ApiProperty()
  @IsNotEmpty()
  PTC: string;
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  TravelsWithPersonOrgID: string;
  @ApiProperty()
  @IsNotEmpty()
  RedressNumber: string;
  @ApiProperty()
  @IsNotEmpty()
  KnownTravelerNumber: string;
  @IsBoolean()
  @ApiProperty()
  @IsNotEmpty()
  MarketingOptIn: boolean;
  @IsBoolean()
  @ApiProperty()
  @IsNotEmpty()
  UseInventory: boolean;
  @ApiProperty()
  @IsNotEmpty()
  @Type(() => AddressDto)
  Address: AddressDto;
  @ApiProperty()
  @IsNotEmpty()
  Company: string;
  @ApiProperty()
  @IsNotEmpty()
  Comments: string;
  @ApiProperty()
  @IsNotEmpty()
  Passport: string;
  @ApiProperty()
  @IsNotEmpty()
  Nationality: string;
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  ProfileId: string;
  IsPrimaryPassenger: boolean;
  @ApiProperty()
  @IsNotEmpty()
  @Type(() => ContactDto)
  ContactInfo: ContactDto;
}

export class PaymentWithAgencyCreditDto {
  @ApiProperty()
  @IsNotEmpty()
  token: string;
  @ApiProperty()
  @IsNotEmpty()
  SeriesNumber: string;
  @ApiProperty()
  @IsNotEmpty()
  confirmationNumber: string;
  @IsNumber()
  @ApiProperty()
  @IsNotEmpty()
  BaseAmount: number;
  @ApiProperty()
  @IsNotEmpty()
  BaseCurrency: string;
  @ApiProperty()
  @IsNotEmpty()
  CheckNumber: string;
  @ApiProperty()
  @IsNotEmpty()
  CurrencyPaid: string;
  @ApiProperty()
  @IsNotEmpty()
  DatePaid: string;
  @ApiProperty()
  @IsNotEmpty()
  ExpirationDate: string;
  @IsNumber()
  @ApiProperty()
  @IsNotEmpty()
  ExchangeRate: number;
  @ApiProperty()
  @IsNotEmpty()
  ExchangeRateDate: string;
  @IsNumber()
  @ApiProperty()
  @IsNotEmpty()
  PaymentAmount: number;
  @ApiProperty()
  @IsNotEmpty()
  iata: string;
  @ApiProperty()
  @IsNotEmpty()
  VoucherNumber: string;
  @ApiProperty()
  @IsNotEmpty()
  OriginalCurrency: string;
  @IsNumber()
  @ApiProperty()
  @IsNotEmpty()
  OriginalAmount: number;
  @ApiProperty()
  @IsNotEmpty()
  @Type(() => payor)
  Payor: payor;
}
