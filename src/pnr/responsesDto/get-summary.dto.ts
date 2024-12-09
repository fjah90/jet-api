import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString, isArray } from 'class-validator';

export class ChargesSummaryDto {
  @IsNumber()
  @ApiProperty({ description: 'Number of distinct persons who had this tax' })
  howManyDistinctPersonsHadThisTax: number;

  @IsString()
  @ApiProperty({ description: 'Tax ID' })
  taxID: string;

  @IsNumber()
  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @IsNumber()
  @ApiProperty({ description: 'Count' })
  count: number;

  @IsString()
  @ApiProperty({ description: 'Tax description' })
  taxDescription: string;
}

export class ExtrasSummaryDto {
  @IsNumber()
  @ApiProperty({ description: 'Number of distinct persons who had this tax' })
  howManyDistinctPersonsHadThisTax: number;

  @IsString()
  @ApiProperty({ description: 'Tax ID' })
  taxID: string;

  @IsNumber()
  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @IsNumber()
  @ApiProperty({ description: 'Count' })
  count: number;

  @IsString()
  @ApiProperty({ description: 'Tax description' })
  taxDescription: string;
}

export class FlightsPassengerSummaryDto {
  @IsString()
  @ApiProperty({ description: 'Passenger type' })
  passengerType: string;

  @IsString()
  @ApiProperty({ description: 'Web fare type' })
  webFareType: string;

  @IsNumber()
  @ApiProperty({ description: 'Fare amount' })
  fareAmount: number;

  @IsNumber()
  @ApiProperty({ description: 'Count' })
  count: number;

  @IsString()
  @ApiProperty({ description: 'String index' })
  stringIndex: string;
}

export class SpecialServiceDto {
  @IsString()
  @ApiProperty({ description: 'Code type' })
  codeType: string;

  @IsString()
  @ApiProperty({ description: 'Service ID' })
  serviceID: string;

  @IsString()
  @ApiProperty({ description: 'SSR category' })
  sSRCategory: string;

  @IsString()
  @ApiProperty({ description: 'Logical flight ID' })
  logicalFlightID: string;

  @IsString()
  @ApiProperty({ description: 'Departure date' })
  departureDate: string;

  @IsString()
  @ApiProperty({ description: 'Amount' })
  amount: string;

  @IsBoolean()
  @ApiProperty({ description: 'Override Amount' })
  overrideAmount: boolean;

  @IsString()
  @ApiProperty({ description: 'Currency code' })
  currencyCode: string;

  @IsBoolean()
  @ApiProperty({ description: 'Commissionable' })
  commissionable: boolean;

  @IsBoolean()
  @ApiProperty({ description: 'Refundable' })
  refundable: boolean;

  @IsString()
  @ApiProperty({ description: 'Charge comment' })
  chargeComment: string;

  @IsString()
  @ApiProperty({ description: 'PersonOrg ID' })
  personOrgID: string;

  @IsString()
  @ApiProperty({ description: 'Physical flight ID' })
  physicalFlightID: string;

  @IsString()
  @ApiProperty({ description: 'Service bundle code' })
  serviceBundleCode: string;
}

export class SegmentDto {
  @IsString()
  @ApiProperty({ description: 'PersonOrg ID' })
  personOrgID: string;

  @IsString()
  @ApiProperty({ description: 'Fare information ID' })
  fareInformationID: string;

  @IsString()
  @ApiProperty({ description: 'Logical flight ID' })
  logicalFlightID: string;

  @IsString()
  @ApiProperty({ description: 'FB Code' })
  fBCode: string;

  @IsString()
  @ApiProperty({ description: 'Marketing code' })
  marketingCode: string;

  @IsString()
  @ApiProperty({ description: 'Store front ID' })
  storeFrontID: string;

  @IsString()
  @ApiProperty({ description: 'Record locator' })
  recordLocator: string;

  @IsString()
  @ApiProperty({ description: 'CRS code' })
  CRSCode: string;

  @ApiProperty({ description: 'Array of special services', type: [SpecialServiceDto] })
  specialServices: SpecialServiceDto[];

  @ApiProperty({ description: 'Array of seats', type: [String] })
  seats: string[];

  @IsString()
  @ApiProperty({ description: 'CRS code' })
  crsCode: string;

  @IsNumber()
  @ApiProperty({ description: 'Base fare amount without taxes' })
  baseFareAmtNoTaxes: number;
}

export class GetSummaryResponse {
  @IsString()
  @ApiProperty({ description: 'Reservation Balance' })
  reservationBalance: string;

  @IsString()
  @ApiProperty({ description: 'Promotional Code' })
  promotionalCode: string;

  @IsArray()
  @ApiProperty({ description: 'Charges Summary', type: () => [ChargesSummaryDto] })
  @Type(() => ChargesSummaryDto)
  chargesSummary: ChargesSummaryDto[];

  @IsArray()
  @ApiProperty({ description: 'Extras Summary', type: () => [ExtrasSummaryDto] })
  @Type(() => ExtrasSummaryDto)
  extrasSummary: ExtrasSummaryDto[];

  @IsArray()
  @ApiProperty({ description: 'Flights Passengers Summary', type: () => [FlightsPassengerSummaryDto] })
  @Type(() => FlightsPassengerSummaryDto)
  flightsPassengerSummary: FlightsPassengerSummaryDto[];

  @IsNumber()
  @ApiProperty({ description: 'Total Charges' })
  totalCharges: number;

  @IsNumber()
  @ApiProperty({ description: 'Total summary Charges' })
  totalSummaryCharges: number;

  @IsArray()
  @ApiProperty({ description: 'Segments', type: () => [SegmentDto] })
  segments: SegmentDto[];
}
