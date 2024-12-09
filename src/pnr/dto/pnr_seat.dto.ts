import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApiProperty } from '@nestjsx/crud/lib/crud';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class PnrSeat {
  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  personOrgID: string = '';

  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  logicalFlightID: string = '';

  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  physicalFlightID: string = '';

  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsDateString()
  departureDate: string = '';

  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  seatSelected: string = '';

  @ApiProperty()
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  rowNumber: string = '';

  public toXml() {
    return {
      'rad1:Seat': {
        'rad1:PersonOrgID': this.personOrgID,
        'rad1:LogicalFlightID': this.logicalFlightID,
        'rad1:PhysicalFlightID': this.physicalFlightID,
        'rad1:DepartureDate': this.departureDate,
        'rad1:SeatSelected': this.seatSelected,
        'rad1:RowNumber': this.rowNumber,
      },
    };
  }
}
