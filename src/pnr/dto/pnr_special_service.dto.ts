import { ApiProperty } from '@nestjsx/crud/lib/crud';
import { IsAlpha, IsDateString, IsString, Max, MaxLength, Min } from 'class-validator';

export class PnrSpecialService {
  @MaxLength(30)
  @IsString()
  @ApiProperty({ default: '' })
  codeType: string;

  @MaxLength(30)
  @IsString()
  @ApiProperty({ default: '' })
  serviceID: string;

  @MaxLength(30)
  @IsString()
  @ApiProperty({ default: '' })
  sSRCategory: string;

  @MaxLength(30)
  @IsString()
  @ApiProperty({ default: '' })
  logicalFlightID: string;

  @IsString()
  @ApiProperty({ default: '' })
  @IsDateString()
  departureDate: string;

  @IsString()
  @ApiProperty({ default: '' })
  @MaxLength(15)
  amount: string;

  @IsString()
  @ApiProperty({ default: '' })
  overrideAmount: string;

  @MaxLength(6)
  @IsAlpha()
  @IsString()
  @ApiProperty({ default: '' })
  currencyCode: string;

  @MaxLength(100)
  @IsString()
  @ApiProperty({ default: '' })
  commissionable: string;

  @MaxLength(100)
  @IsString()
  @ApiProperty({ default: '' })
  refundable: string;

  @MaxLength(400)
  @IsString()
  @ApiProperty({ default: '' })
  chargeComment: string;

  @MaxLength(100)
  @IsString()
  @ApiProperty({ default: '' })
  personOrgID: string;

  @MaxLength(40)
  @IsString()
  @ApiProperty({ default: '' })
  physicalFlightID: string;

  @MaxLength(30)
  @IsString()
  @ApiProperty({ default: '' })
  serviceBundleCode: string;

  public toXml() {
    return {
      'rad1:SpecialService': {
        'rad1:CodeType': this.codeType,
        'rad1:ServiceID': this.serviceID,
        'rad1:SSRCategory': this.sSRCategory,
        'rad1:LogicalFlightID': this.logicalFlightID,
        'rad1:DepartureDate': this.departureDate,
        'rad1:Amount': this.amount,
        'rad1:OverrideAmount': this.overrideAmount,
        'rad1:CurrencyCode': this.currencyCode,
        'rad1:Commissionable': this.commissionable,
        'rad1:Refundable': this.refundable,
        'rad1:ChargeComment': this.chargeComment,
        'rad1:PersonOrgID': this.personOrgID,
        'rad1:PhysicalFlightID': this.physicalFlightID,
        'rad1:ServiceBundleCode': this.serviceBundleCode,
      },
    };
  }
}
