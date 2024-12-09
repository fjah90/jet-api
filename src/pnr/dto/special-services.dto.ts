import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';
import { AvailableCurrencies } from 'src/currencies/interfaces/currencies-enum';

export class SpecialServicesDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  codeType: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  serviceId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  ssrCategory: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  logicalFlightId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  departureDate: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Transform((params) => Number(params.value))
  amount: number;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  overrideAmount: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currencyCode: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  commissionable?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  refundable?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  chargeComment: boolean;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  personOrgId: number;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  overrideAmtReason?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  extPenaltyRule?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  extIsRePriceFixed?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  extRePriceSourceName?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  extRePriceValue?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  extRePriceValueReason?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  serviceBundleCode?: boolean;
  comment: Comment;
}

class Comment {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  commentID: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  commentMessage: string;
}
