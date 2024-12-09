import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString } from 'class-validator';

export class PassengersIncluded {
  @ApiProperty({ description: 'Key of Passenger' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Qunatity to included' })
  @IsString()
  included: number;

  @ApiProperty({ description: 'ServiceBundle' })
  serviceBundle: string;

  constructor(data: Partial<PassengersIncluded>) {
    Object.assign(this, data);
  }
}

export class SubExtraOption {
  @IsString()
  @ApiProperty({ description: 'Title' })
  title: string;

  @IsString()
  @ApiProperty({ description: 'Description' })
  description: string;

  @IsNumber()
  @ApiProperty({ description: 'SSR ID' })
  ssrId: number;

  @IsNumber()
  @ApiProperty({ description: 'ID' })
  id: number;

  @IsNumber()
  @ApiProperty({ description: 'Quantity Without Pay' })
  quantityWithoutPay: number;

  @IsString()
  @ApiProperty({ description: 'Type' })
  type: string;

  @IsString()
  @ApiProperty({ description: 'Code' })
  code: string;

  @IsNumber()
  @ApiProperty({ description: 'Max Quantity' })
  maxQuantity: number;

  @IsString()
  @ApiProperty({ description: 'Amount' })
  amount: string;

  @IsString()
  @ApiProperty({ description: 'Icon' })
  icon: string;

  @IsString()
  @ApiProperty({ description: 'Service ID' })
  serviceID: string;

  @IsString()
  @ApiProperty({ description: 'Category ID' })
  categoryID: string;

  @IsString()
  @ApiProperty({ description: 'Quantity Available' })
  quantityAvailable: string;

  @IsString()
  @ApiProperty({ description: 'Service Active' })
  serviceActive: string;

  @IsBoolean()
  @ApiProperty({ description: 'Refundable', type: Boolean })
  refundable: boolean;

  @IsBoolean()
  @ApiProperty({ description: 'Commissionable', type: Boolean })
  commissionable: boolean;

  @IsNumber()
  @ApiProperty({ description: 'Passenger Types Available', isArray: true, example: [1, 2, 3] })
  passengerTypesAvailable: number[];

  @ApiProperty({ description: 'Array of passengers included', type: () => [PassengersIncluded] })
  @Type(() => PassengersIncluded)
  passengersIncluded: PassengersIncluded[];
}

export class ExtraOption {
  @ApiProperty({ description: 'The SSR id' })
  @IsNumber()
  ssrId: number;

  @ApiProperty({ description: 'The title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'The quantity without pay' })
  @IsNumber()
  quantityWithoutPay: number;

  @ApiProperty({ description: 'The type' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'The mobile icon' })
  @IsString()
  mobileIcon: string;

  @ApiProperty({ description: 'The short description' })
  @IsString()
  shortDescription: string;

  @ApiProperty({ description: 'The description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'The icon' })
  @IsString()
  icon: string;

  @ApiProperty({ description: 'The image' })
  @IsString()
  image: string;

  @ApiProperty({ description: 'The included summary' })
  @IsNumber()
  includedSummary: number;

  @ApiProperty({ description: 'The array of ExtraOption objects', type: () => [SubExtraOption] })
  @Type(() => SubExtraOption)
  options: SubExtraOption[];

  constructor(data: Partial<ExtraOption>) {
    Object.assign(this, data);
  }
}

export class FlightWithExtras {
  @ApiProperty({ description: 'The logical flight ID' })
  @IsString()
  logicalFlightID: string;

  @ApiProperty({ description: 'The array of ExtraOption objects', type: () => [ExtraOption] })
  @Type(() => ExtraOption)
  extras: ExtraOption[];
}
export class GetExtrasResponse {
  @IsArray()
  @ApiProperty({ description: 'Array of flights', type: () => [FlightWithExtras] })
  @Type(() => FlightWithExtras)
  flights: FlightWithExtras[];
}
