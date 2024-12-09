import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, ValidateNested } from 'class-validator';
import { PnrSeat } from './pnr_seat.dto';
import { Type } from 'class-transformer';
import { PnrSpecialService } from './pnr_special_service.dto';

export class SegmentDto {
  @MaxLength(100)
  @ApiProperty({ default: '' })
  @ApiPropertyOptional()
  @IsString()
  personOrgID: string;

  @MaxLength(100)
  @ApiProperty({ default: '' })
  @ApiPropertyOptional()
  @IsString()
  fareInformationID: string;

  @MaxLength(100)
  @ApiProperty({ default: '' })
  @ApiPropertyOptional()
  @IsString()
  logicalFlightID: string;

  @MaxLength(100)
  @ApiProperty({ default: '' })
  @ApiPropertyOptional()
  @IsString()
  fBCode: string;

  @MaxLength(100)
  @ApiProperty({ default: '' })
  @ApiPropertyOptional()
  @IsString()
  marketingCode: string;

  @MaxLength(100)
  @ApiProperty({ default: '' })
  @ApiPropertyOptional()
  @IsString()
  storeFrontID: string;

  @MaxLength(100)
  @ApiProperty({ default: '' })
  @ApiPropertyOptional()
  @IsString()
  recordLocator: string;

  @ApiProperty({ type: () => [PnrSpecialService] })
  @ApiPropertyOptional()
  @ValidateNested({ each: true })
  @Type(() => PnrSpecialService)
  specialServices: PnrSpecialService[];

  @ApiProperty({ type: () => [PnrSeat] })
  @ApiPropertyOptional()
  @ValidateNested({ each: true })
  @Type(() => PnrSeat)
  seats: PnrSeat[];

  @MaxLength(100)
  @ApiProperty({ default: '' })
  @IsString()
  CRSCode = '';

  public toXml() {
    return {
      'rad1:Segment': {
        'rad1:PersonOrgID': this.personOrgID,
        'rad1:FareInformationID': this.fareInformationID,
        'rad1:MarketingCode': this.marketingCode,
        'rad1:StoreFrontID': this.storeFrontID,
        'rad1:RecordLocator': this.recordLocator,
        'rad1:SpecialServices': this.specialServices.map((specialService) => specialService.toXml()),
        'rad1:Seats': this.seats.map((seat) => seat.toXml()),
        'rad1:CRSCode': this.CRSCode,
      },
    };
  }
}
