import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { PassengerOfCheckinDto } from 'src/checkin/dto';

export class SeatElementDto extends PassengerOfCheckinDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  seat: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  rowNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  oldSeat: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  oldRowNumber: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isExtraSeat: boolean;

  @ApiProperty()
  @IsString()
  physicalFlightID: string;

  @ApiProperty()
  @IsString()
  logicalFlightKey: string;

  @ApiProperty()
  @IsString()
  physicalFlightKey: string;
}
